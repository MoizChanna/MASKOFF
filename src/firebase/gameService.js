import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore'
import { db } from './config'
import { pickWordPair } from '../utils/wordPairs'
import { generateRoomCode, assignRoles } from '../utils/roomUtils'

// ─── Room Management ──────────────────────────────────────────────────────────

export async function createRoom(hostName, settings) {
  const roomCode = generateRoomCode()
  const { assetWord, ghostWord } = pickWordPair()
  const hostPlayer = {
    id: crypto.randomUUID(),
    name: hostName,
    role: null,
    word: null,
    alive: true,
    clues: [],
    votesReceived: 0,
    hasVoted: false,
    hasSubmittedClue: false,
    isHost: true,
  }

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Firebase connection timed out — check environment variables')), 10000)
  )

  await Promise.race([
    setDoc(doc(db, 'rooms', roomCode), {
      createdAt: serverTimestamp(),
      settings,
      status: 'lobby',
      round: 1,
      currentRevealIndex: 0,
      currentTurnIndex: 0,
      assetWord,
      ghostWord,
      winner: null,
      players: [hostPlayer],
    }),
    timeout,
  ])

  sessionStorage.setItem(`maskoff_${roomCode}`, hostPlayer.id)
  return { roomCode, playerId: hostPlayer.id }
}

export async function joinRoom(roomCode, playerName) {
  const roomRef = doc(db, 'rooms', roomCode)
  const snap = await getDoc(roomRef)

  if (!snap.exists()) throw new Error('NO_SUCH_FILE')

  const data = snap.data()

  // Check expiry (2 hours)
  const createdAt = data.createdAt?.toDate?.()
  if (createdAt && Date.now() - createdAt.getTime() > 2 * 60 * 60 * 1000) {
    throw new Error('EXPIRED')
  }

  if (data.status !== 'lobby') throw new Error('IN_PROGRESS')

  // Rejoin with same name
  const existing = data.players.find(
    (p) => p.name.toLowerCase() === playerName.toLowerCase()
  )
  if (existing) {
    sessionStorage.setItem(`maskoff_${roomCode}`, existing.id)
    return { playerId: existing.id, rejoined: true }
  }

  if (data.players.length >= data.settings.playerCount) {
    throw new Error('ACCESS_DENIED')
  }

  const newPlayer = {
    id: crypto.randomUUID(),
    name: playerName,
    role: null,
    word: null,
    alive: true,
    clues: [],
    votesReceived: 0,
    hasVoted: false,
    hasSubmittedClue: false,
    isHost: false,
  }

  await updateDoc(roomRef, { players: arrayUnion(newPlayer) })
  sessionStorage.setItem(`maskoff_${roomCode}`, newPlayer.id)
  return { playerId: newPlayer.id, rejoined: false }
}

export function subscribeToRoom(roomCode, callback) {
  return onSnapshot(doc(db, 'rooms', roomCode), (snap) => {
    if (snap.exists()) callback(snap.data())
  })
}

// ─── Game Start ───────────────────────────────────────────────────────────────

export async function startGame(roomCode) {
  const roomRef = doc(db, 'rooms', roomCode)
  const snap = await getDoc(roomRef)
  const data = snap.data()

  const assigned = assignRoles(data.players, data.settings, data.assetWord, data.ghostWord)

  await updateDoc(roomRef, {
    players: assigned,
    status: 'revealing',
    currentRevealIndex: 0,
  })
}

// ─── Role Reveal ──────────────────────────────────────────────────────────────

export async function advanceReveal(roomCode, nextIndex, totalPlayers) {
  const roomRef = doc(db, 'rooms', roomCode)
  if (nextIndex >= totalPlayers) {
    await updateDoc(roomRef, { status: 'playing', currentRevealIndex: 0 })
  } else {
    await updateDoc(roomRef, { currentRevealIndex: nextIndex })
  }
}

export async function skipVote(roomCode) {
  const roomRef = doc(db, 'rooms', roomCode)
  const snap = await getDoc(roomRef)
  const data = snap.data()

  const { assetWord, ghostWord } = pickWordPair()

  const players = data.players.map((p) => ({
    ...p,
    clues: [],
    hasVoted: false,
    hasSubmittedClue: false,
    votesReceived: 0,
    votedFor: null,
    ...(p.alive ? { word: p.role === 'GHOST' ? ghostWord : p.role === 'VOID' ? '???' : assetWord } : {}),
  }))

  await updateDoc(roomRef, {
    players,
    assetWord,
    ghostWord,
    status: 'playing',
    round: data.round + 1,
    currentTurnIndex: 0,
    skipReason: null,
  })
}

// ─── Clue Submission ─────────────────────────────────────────────────────────

export async function submitClue(roomCode, playerId, clue, round) {
  const roomRef = doc(db, 'rooms', roomCode)
  const snap = await getDoc(roomRef)
  const data = snap.data()

  const players = data.players.map((p) => {
    if (p.id !== playerId) return p
    return {
      ...p,
      clues: [...p.clues, { round, text: clue }],
      hasSubmittedClue: true,
    }
  })

  const allSubmitted = players.filter((p) => p.alive).every((p) => p.hasSubmittedClue)

  await updateDoc(roomRef, {
    players,
    ...(allSubmitted ? { status: 'voting' } : {}),
  })
}

// ─── Voting ───────────────────────────────────────────────────────────────────

export async function castVote(roomCode, voterId, targetId) {
  const roomRef = doc(db, 'rooms', roomCode)
  const snap = await getDoc(roomRef)
  const data = snap.data()

  const isSkip = targetId === 'SKIP'
  const players = data.players.map((p) => {
    if (p.id === voterId) return { ...p, hasVoted: true, votedFor: targetId }
    if (!isSkip && p.id === targetId) return { ...p, votesReceived: p.votesReceived + 1 }
    return p
  })

  const alivePlayers = players.filter((p) => p.alive)
  const allVoted = alivePlayers.every((p) => p.hasVoted)

  let newStatus = null
  let skipReason = null

  if (allVoted) {
    const skipVotes = alivePlayers.filter((p) => p.votedFor === 'SKIP').length

    const voteCounts = {}
    alivePlayers.forEach((p) => {
      if (p.votedFor && p.votedFor !== 'SKIP') {
        voteCounts[p.votedFor] = (voteCounts[p.votedFor] || 0) + 1
      }
    })

    const maxPlayerVotes = Math.max(0, ...Object.values(voteCounts))
    const playersWithMax = Object.keys(voteCounts).filter((id) => voteCounts[id] === maxPlayerVotes)
    const isTie = playersWithMax.length > 1

    if (skipVotes >= maxPlayerVotes || isTie) {
      newStatus = 'skipping'
      skipReason = isTie && skipVotes < maxPlayerVotes ? 'tie' : 'skip'
    } else {
      newStatus = 'eliminating'
    }
  }

  await updateDoc(roomRef, {
    players,
    ...(newStatus ? { status: newStatus } : {}),
    ...(skipReason ? { skipReason } : {}),
  })
}

// ─── Elimination & Round Advance ─────────────────────────────────────────────

export async function processElimination(roomCode) {
  const roomRef = doc(db, 'rooms', roomCode)
  const snap = await getDoc(roomRef)
  const data = snap.data()

  const alivePlayers = data.players.filter((p) => p.alive)
  const mostVoted = alivePlayers.reduce((max, p) =>
    p.votesReceived > max.votesReceived ? p : max
  )

  // Reset round state for all, mark eliminated player as dead
  let players = data.players.map((p) => ({
    ...p,
    alive: p.id === mostVoted.id ? false : p.alive,
    hasVoted: false,
    hasSubmittedClue: false,
    votesReceived: 0,
    votedFor: null,
    clues: [],
  }))

  // Check win conditions against the updated alive set
  const stillAlive = players.filter((p) => p.alive)
  const ghostAlive = stillAlive.some((p) => p.role === 'GHOST')
  const assetCount = stillAlive.filter((p) => p.role === 'ASSET').length
  const voidAlive = stillAlive.some((p) => p.role === 'VOID')

  let winner = null
  if (!ghostAlive) {
    winner = 'assets'
  } else if (assetCount <= 1) {
    winner = 'ghost'
  }

  if (mostVoted.role === 'GHOST' && winner === 'assets' && voidAlive) {
    if (stillAlive.filter((p) => p.role === 'ASSET').length === 0) {
      winner = 'void'
    }
  }

  // Game continues — assign fresh word pair and update surviving players' words
  let roundWords = {}
  if (!winner) {
    const { assetWord, ghostWord } = pickWordPair()
    roundWords = { assetWord, ghostWord }
    players = players.map((p) => {
      if (!p.alive) return p
      return { ...p, word: p.role === 'GHOST' ? ghostWord : p.role === 'VOID' ? '???' : assetWord }
    })
  }

  await updateDoc(roomRef, {
    players,
    eliminatedId: mostVoted.id,
    winner,
    status: winner ? 'ended' : 'playing',
    round: winner ? data.round : data.round + 1,
    ...roundWords,
  })

  return { eliminated: mostVoted, winner }
}

export async function ghostGuess(roomCode, ghostId, guessedWord) {
  const roomRef = doc(db, 'rooms', roomCode)
  const snap = await getDoc(roomRef)
  const data = snap.data()

  const correct =
    guessedWord.trim().toLowerCase() === data.assetWord.trim().toLowerCase()

  const players = data.players.map((p) =>
    p.id === ghostId ? { ...p, ghostGuess: guessedWord, ghostGuessCorrect: correct } : p
  )

  await updateDoc(roomRef, {
    players,
    winner: correct ? 'ghost' : data.winner,
    status: correct ? 'ended' : data.status,
  })

  return correct
}

export async function voidGuess(roomCode, voidId, guessedWord) {
  const roomRef = doc(db, 'rooms', roomCode)
  const snap = await getDoc(roomRef)
  const data = snap.data()

  const correct =
    guessedWord.trim().toLowerCase() === data.assetWord.trim().toLowerCase()

  const players = data.players.map((p) =>
    p.id === voidId ? { ...p, voidGuess: guessedWord, voidGuessCorrect: correct } : p
  )

  await updateDoc(roomRef, {
    players,
    winner: correct ? 'void' : 'assets',
    status: 'ended',
  })

  return correct
}

export async function resetRoom(roomCode) {
  const roomRef = doc(db, 'rooms', roomCode)
  const snap = await getDoc(roomRef)
  const data = snap.data()

  const { assetWord, ghostWord } = pickWordPair()

  const freshPlayers = data.players.map((p) => ({
    ...p,
    role: null,
    word: null,
    alive: true,
    clues: [],
    votesReceived: 0,
    hasVoted: false,
    hasSubmittedClue: false,
    votedFor: null,
  }))

  await updateDoc(roomRef, {
    status: 'lobby',
    round: 1,
    currentRevealIndex: 0,
    currentTurnIndex: 0,
    assetWord,
    ghostWord,
    winner: null,
    eliminatedId: null,
    skipReason: null,
    players: freshPlayers,
    createdAt: serverTimestamp(),
  })
}
