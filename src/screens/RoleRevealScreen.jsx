import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoom } from '../hooks/useRoom'
import { advanceReveal } from '../firebase/gameService'
import { useSound } from '../hooks/useSound'
import { getInitials } from '../utils/roomUtils'

const ROLE_CONFIG = {
  ASSET: {
    color: 'var(--green)',
    stamp: 'ASSET',
    stampClass: 'stamp-green',
    description:
      'You are an ASSET. You have the real intel. Blend your clues — not too obvious, not too vague. Help identify the Ghost without exposing the word.',
  },
  GHOST: {
    color: 'var(--red)',
    stamp: 'GHOST',
    stampClass: 'stamp-red',
    description:
      'You are the GHOST. You have a similar but different word. Study the Assets carefully. Mirror their energy. Survive long enough to win — or guess the word if eliminated.',
  },
  VOID: {
    color: 'var(--yellow)',
    stamp: 'VOID',
    stampClass: 'stamp-yellow',
    description:
      'You are the VOID. You have no word. No intel. Nothing. Listen to every clue, piece together the truth, and fake it until you make it.',
  },
}

export default function RoleRevealScreen() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { room, me, loading } = useRoom(roomCode)
  const { playSound } = useSound()
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => {
    if (!room) return
    if (room.status === 'playing') navigate(`/game/${roomCode}`)
  }, [room, roomCode, navigate])

  // Rule 4: Reset flip whenever currentRevealIndex changes
  useEffect(() => {
    setIsFlipped(false)
  }, [room?.currentRevealIndex])

  if (loading || !room) {
    return (
      <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="terminal-loader"><div className="terminal-spinner" />LOADING...</div>
      </div>
    )
  }

  const { players, currentRevealIndex } = room
  const currentPlayer = players[currentRevealIndex]

  // Rule 6: Only the current player's device shows the card.
  // Every other device/tab shows a waiting screen — no card, no data.
  const isMyTurn = me != null && currentPlayer != null && me.id === currentPlayer.id

  if (!isMyTurn) {
    return (
      <div className="screen" style={{ justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
        <div className="logo" style={{ fontSize: '2rem' }}>MASKOFF</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
          <div className="stamp stamp-red">CLASSIFIED</div>
          <p style={{ color: 'var(--manila)', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.08em' }}>
            MISSION BRIEFING IN PROGRESS
          </p>
          <p className="label">STAND BY...</p>
        </div>
        <div className="terminal-loader" style={{ justifyContent: 'center' }}>
          <div className="terminal-spinner" />
          Agent {currentRevealIndex + 1} of {players.length} being briefed
        </div>
      </div>
    )
  }

  const cfg = ROLE_CONFIG[currentPlayer.role] ?? ROLE_CONFIG.ASSET

  const handleFlip = () => {
    if (isFlipped) return
    setIsFlipped(true)
    playSound('reveal')
  }

  const handleUnderstood = async () => {
    playSound('stamp')
    await advanceReveal(roomCode, currentRevealIndex + 1, players.length)
  }

  return (
    <div className="screen" style={{ justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div className="logo" style={{ fontSize: '1.8rem' }}>MASKOFF</div>
        <p className="label" style={{ marginTop: '0.4rem', color: 'var(--yellow)' }}>
          ROLE REVEAL — AGENT {currentRevealIndex + 1} OF {players.length}
        </p>
      </div>

      {/* Player name */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--manila)', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.1em' }}>
          YOUR BRIEFING,
        </p>
        <p style={{ color: 'var(--green)', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '2rem', letterSpacing: '0.06em' }}>
          {currentPlayer.name.toUpperCase()}
        </p>
      </div>

      {/* Card — Rule 2 & 3: CardBack is NEVER in DOM when isFlipped is false */}
      <div style={{ maxWidth: 340, width: '100%' }}>
        {!isFlipped ? (
          /* Rule 3: Front shows ONLY classified */
          <div onClick={handleFlip} style={card('#13131a', '2px solid var(--muted)', 'pointer')}>
            <CardFront />
          </div>
        ) : (
          /* Role + word rendered only after flip — never visible before */
          <div style={card('#13131a', `2px solid ${cfg.color}`, 'default', true)}>
            <CardBack player={currentPlayer} cfg={cfg} />
          </div>
        )}
      </div>

      {/* Rule 5: UNDERSTOOD button only when flipped */}
      {!isFlipped ? (
        <p className="label" style={{ textAlign: 'center' }}>Tap the card to reveal your role</p>
      ) : (
        <button
          className="btn btn-primary"
          style={{ maxWidth: 340, width: '100%' }}
          onClick={handleUnderstood}
        >
          UNDERSTOOD — PASSING THE PHONE
        </button>
      )}
    </div>
  )
}

function CardFront() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1.5rem', padding: '2rem' }}>
      <div className="logo" style={{ fontSize: '2.5rem' }}>MASKOFF</div>
      <div className="stamp stamp-red">CLASSIFIED</div>
      <p className="label" style={{ textAlign: 'center' }}>TAP TO REVEAL YOUR DOSSIER</p>
    </div>
  )
}

function CardBack({ player, cfg }) {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', background: cfg.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#090910', fontFamily: 'var(--font-head)', fontWeight: 800,
          fontSize: '1.2rem', flexShrink: 0,
        }}>
          {getInitials(player.name)}
        </div>
        <div>
          <p style={{ color: 'var(--manila)', fontWeight: 700, fontSize: '1.1rem', fontFamily: 'var(--font-head)' }}>
            {player.name}
          </p>
          <p className="label">OPERATIVE IDENTITY</p>
        </div>
      </div>

      <div className="divider" />

      {/* Role stamp */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div className={`stamp ${cfg.stampClass}`} style={{ fontSize: '1.8rem' }}>
          {cfg.stamp}
        </div>
      </div>

      {/* Intel word */}
      <div style={{ textAlign: 'center' }}>
        <p className="label">YOUR INTEL WORD</p>
        <p style={{ fontSize: '2rem', fontFamily: 'var(--font-head)', fontWeight: 800, color: cfg.color, marginTop: '0.25rem', letterSpacing: '0.06em' }}>
          {player.word ?? '???'}
        </p>
      </div>

      <div className="divider" />

      {/* Role description */}
      <p style={{ fontSize: '0.8rem', color: 'var(--text)', lineHeight: 1.6, fontStyle: 'italic' }}>
        {cfg.description}
      </p>
    </div>
  )
}

function card(bg, border, cursor = 'pointer', animated = false) {
  return {
    background: bg,
    border,
    borderRadius: 'var(--radius)',
    minHeight: 320,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    cursor,
    width: '100%',
    animation: animated ? 'cardFlipIn 0.35s ease-out' : 'none',
  }
}
