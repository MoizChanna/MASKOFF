import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoom } from '../hooks/useRoom'
import { castVote, processElimination, skipVote } from '../firebase/gameService'
import { useSound } from '../hooks/useSound'

export default function VotingScreen() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { room, me, isHost, loading } = useRoom(roomCode)
  const { playSound } = useSound()
  const [eliminated, setEliminated] = useState(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!room) return
    if (room.status === 'playing') navigate(`/game/${roomCode}`)
    if (room.status === 'ended') navigate(`/end/${roomCode}`)

    if (room.status === 'eliminating' && isHost && !processing) {
      setProcessing(true)
      processElimination(roomCode).then(({ eliminated: e }) => {
        setEliminated(e)
        playSound('eliminate')
      })
    }

    if (room.status === 'skipping' && isHost && !processing) {
      setProcessing(true)
      setTimeout(() => skipVote(roomCode), 3000)
    }
  }, [room, roomCode, navigate, isHost, processing, playSound])

  if (loading || !room || !me) {
    return (
      <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="terminal-loader"><div className="terminal-spinner" />LOADING...</div>
      </div>
    )
  }

  const alivePlayers = room.players.filter((p) => p.alive)
  const hasVoted = me.hasVoted
  const myVotedFor = me.votedFor ?? null
  const skipVoteCount = alivePlayers.filter((p) => p.votedFor === 'SKIP').length
  const isSkipping = room.status === 'skipping'

  const handleVote = async (targetId) => {
    if (hasVoted || !me.alive) return
    playSound('stamp')
    await castVote(roomCode, me.id, targetId)
  }

  const eliminatedPlayer = room.eliminatedId
    ? room.players.find((p) => p.id === room.eliminatedId)
    : eliminated

  return (
    <div className="screen">
      <div className="screen-inner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="label">ROUND {room.round}</p>
            <h2 style={{ color: 'var(--red)', fontFamily: 'var(--font-head)', fontSize: '1.4rem' }}>
              IDENTIFY THE GHOST
            </h2>
          </div>
          <div className="logo" style={{ fontSize: '1.4rem' }}>MASKOFF</div>
        </div>

        {isSkipping ? (
          <SkipResult reason={room.skipReason} />
        ) : (
          <>
            {/* Mugshot grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {alivePlayers.map((p) => {
                const clueThisRound = p.clues?.find((c) => c.round === room.round)
                const isEliminated = eliminatedPlayer?.id === p.id
                const isMe = p.id === me.id
                const isVotedFor = myVotedFor === p.id

                return (
                  <MugshotCard
                    key={p.id}
                    player={p}
                    clue={clueThisRound?.text ?? '—'}
                    votesReceived={p.votesReceived}
                    isEliminated={isEliminated}
                    isMe={isMe}
                    hasVoted={hasVoted}
                    isVotedFor={isVotedFor}
                    canVote={!hasVoted && me.alive && !isMe}
                    onVote={() => handleVote(p.id)}
                  />
                )
              })}
            </div>

            {/* OR divider + skip card — alive players only */}
            {me.alive && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="divider" style={{ flex: 1 }} />
                  <span className="label">OR</span>
                  <div className="divider" style={{ flex: 1 }} />
                </div>

                <div
                  className={`skip-card${myVotedFor === 'SKIP' ? ' voted' : ''}${hasVoted && myVotedFor !== 'SKIP' ? ' locked-out' : ''}`}
                  onClick={() => handleVote('SKIP')}
                >
                  <div className="skip-icon">⊘</div>
                  <div style={{ flex: 1 }}>
                    <div className="skip-title">SKIP ROUND</div>
                    <div className="skip-subtitle">No agent eliminated this round</div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '5rem' }}>
                    <div className="skip-tally">{skipVoteCount} vote{skipVoteCount !== 1 ? 's' : ''}</div>
                    {myVotedFor === 'SKIP' && <div className="vote-locked-label">VOTE LOCKED</div>}
                  </div>
                </div>
              </>
            )}

            {/* Status line */}
            {eliminatedPlayer ? (
              <EliminationResult player={eliminatedPlayer} />
            ) : hasVoted ? (
              <div className="terminal-loader" style={{ justifyContent: 'center' }}>
                <div className="terminal-spinner" />
                Vote cast — awaiting results<span className="blink">_</span>
              </div>
            ) : me.alive ? (
              <p className="label" style={{ textAlign: 'center' }}>Tap a mugshot to cast your vote</p>
            ) : (
              <p className="label" style={{ textAlign: 'center', color: 'var(--muted)' }}>You have been eliminated.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function MugshotCard({ player, clue, votesReceived, isEliminated, isMe, hasVoted, isVotedFor, canVote, onVote }) {
  let borderColor = isMe ? 'var(--green)' : 'var(--muted)'
  if (isVotedFor) borderColor = 'var(--yellow)'

  return (
    <div
      onClick={canVote ? onVote : undefined}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius)',
        padding: '0.85rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        cursor: canVote ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.15s, opacity 0.15s',
        opacity: hasVoted && !isVotedFor ? 0.35 : 1,
      }}
    >
      {isEliminated && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(9,9,16,0.7)', zIndex: 5 }}>
          <div className="stamp stamp-red stamp-slam" style={{ fontSize: '1rem', transform: 'rotate(-8deg)' }}>
            ELIMINATED
          </div>
        </div>
      )}

      <p style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--manila)', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {player.name}
      </p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text)', fontStyle: 'italic' }}>&ldquo;{clue}&rdquo;</p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
        <div className="tally">
          {Array.from({ length: votesReceived }).map((_, i) => (
            <span key={i} className="tally-mark" style={{ animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem' }}>
          {isMe && <span className="label" style={{ color: 'var(--green)', fontSize: '0.6rem' }}>YOU</span>}
          {isVotedFor && <span className="vote-locked-label">VOTE LOCKED</span>}
        </div>
      </div>
    </div>
  )
}

function SkipResult({ reason }) {
  const isTie = reason === 'tie'
  return (
    <div className="card skip-result" style={{ textAlign: 'center' }}>
      <div
        className="stamp stamp-skip stamp-slam"
        style={{ marginBottom: '1rem', fontSize: 'clamp(1rem, 5vw, 1.5rem)' }}
      >
        {isTie ? 'AGENTS DIVIDED' : 'ROUND SKIPPED'}
      </div>
      {isTie && (
        <p className="label" style={{ marginBottom: '0.5rem' }}>ROUND SKIPPED</p>
      )}
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No agent was eliminated.</p>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>The mission continues...</p>
      <div className="terminal-loader" style={{ justifyContent: 'center', marginTop: '1rem' }}>
        <div className="terminal-spinner" style={{ borderTopColor: '#888' }} />
        <span style={{ color: '#888' }}>Advancing mission<span className="blink">_</span></span>
      </div>
    </div>
  )
}

function EliminationResult({ player }) {
  const roleLabel = player.role?.toUpperCase() ?? '???'
  const roleColor = player.role === 'GHOST' ? 'var(--red)' : player.role === 'VOID' ? 'var(--yellow)' : 'var(--green)'

  return (
    <div className="card" style={{ textAlign: 'center', borderColor: roleColor }}>
      <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>OPERATIVE EXPOSED</p>
      <p style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--manila)' }}>
        {player.name}
      </p>
      <p style={{ marginTop: '0.25rem' }}>
        was a{' '}
        <span style={{ color: roleColor, fontWeight: 700 }}>{roleLabel}</span>
      </p>
      <div className="terminal-loader" style={{ justifyContent: 'center', marginTop: '1rem' }}>
        <div className="terminal-spinner" />
        Advancing mission<span className="blink">_</span>
      </div>
    </div>
  )
}
