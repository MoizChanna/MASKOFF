import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoom } from '../hooks/useRoom'
import { submitClue } from '../firebase/gameService'
import { useSound } from '../hooks/useSound'
import { getInitials } from '../utils/roomUtils'

export default function GameScreen() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { room, me, loading } = useRoom(roomCode)
  const { playSound } = useSound()
  const [clue, setClue] = useState('')
  const [clueErr, setClueErr] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!room) return
    if (room.status === 'voting' || room.status === 'eliminating') navigate(`/vote/${roomCode}`)
    if (room.status === 'ended') navigate(`/end/${roomCode}`)
    if (room.status === 'lobby') navigate(`/lobby/${roomCode}`)
  }, [room, roomCode, navigate])

  if (loading || !room || !me) {
    return (
      <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="terminal-loader"><div className="terminal-spinner" />CONNECTING...</div>
      </div>
    )
  }

  const alivePlayers = room.players.filter((p) => p.alive)
  const allSubmitted = alivePlayers.every((p) => p.hasSubmittedClue)

  const handleSubmit = async () => {
    const trimmed = clue.trim()
    if (!trimmed) { setClueErr('Enter a clue, agent.'); return }
    if (/\s/.test(trimmed)) { setClueErr('One word only, agent.'); return }
    setSubmitting(true)
    setClueErr('')
    await submitClue(roomCode, me.id, trimmed, room.round)
    playSound('stamp')
    setClue('')
    setSubmitting(false)
  }

  return (
    <div className="screen">
      <div className="screen-inner">
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="label">ROUND {room.round}</p>
            <p style={{ color: 'var(--green)', fontSize: '0.75rem', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>
              MISSION IN PROGRESS
            </p>
          </div>
          <div className="logo" style={{ fontSize: '1.4rem' }}>MASKOFF</div>
        </div>

        {/* Your word */}
        <div className="card" style={{ textAlign: 'center', borderColor: roleColor(me.role) }}>
          <p className="label">YOUR INTEL WORD</p>
          <p style={{ fontSize: '1.8rem', fontFamily: 'var(--font-head)', fontWeight: 800, color: roleColor(me.role), marginTop: '0.25rem', letterSpacing: '0.05em' }}>
            {me.word ?? '???'}
          </p>
          <p className="label" style={{ marginTop: '0.25rem', color: roleColor(me.role), fontSize: '0.65rem' }}>
            [{me.role?.toUpperCase()}]
          </p>
        </div>

        {/* Player roster */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <p className="label" style={{ marginBottom: '0.25rem' }}>OPERATIVES</p>
          {room.players.map((p) => (
            <PlayerRow key={p.id} player={p} round={room.round} isMe={p.id === me.id} />
          ))}
        </div>

        {/* Clue input */}
        {me.alive && !me.hasSubmittedClue && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="label">TRANSMIT YOUR CLUE</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                placeholder="TRANSMIT YOUR CLUE..."
                value={clue}
                maxLength={30}
                onChange={(e) => { setClue(e.target.value); setClueErr('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button
                className="btn btn-primary"
                style={{ width: 'auto', whiteSpace: 'nowrap', padding: '0 1.25rem' }}
                disabled={submitting}
                onClick={handleSubmit}
              >
                TRANSMIT
              </button>
            </div>
            {clueErr && <p className="error-text">{clueErr}</p>}
          </div>
        )}

        {me.hasSubmittedClue && !allSubmitted && (
          <div className="terminal-loader" style={{ justifyContent: 'center' }}>
            <div className="terminal-spinner" />
            Waiting for all agents to transmit<span className="blink">_</span>
          </div>
        )}

        {allSubmitted && (
          <button className="btn btn-danger" onClick={() => navigate(`/vote/${roomCode}`)}>
            PROCEED TO VOTE
          </button>
        )}
      </div>
    </div>
  )
}

function PlayerRow({ player, round, isMe }) {
  const clueThisRound = player.clues?.find((c) => c.round === round)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.6rem 0.75rem',
      background: 'var(--surface2)',
      borderRadius: 'var(--radius)',
      borderLeft: isMe ? '3px solid var(--green)' : '3px solid transparent',
      opacity: player.alive ? 1 : 0.45,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {!player.alive && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(230,57,70,0.06) 4px, rgba(230,57,70,0.06) 5px)',
          pointerEvents: 'none',
        }} />
      )}
      <span className={player.alive ? 'dot-alive' : 'dot-dead'} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: player.alive ? 'var(--manila)' : 'var(--muted)', fontWeight: 600, fontSize: '0.9rem' }}>
            {player.alive ? player.name : <span className="redacted" style={{ padding: '0 2rem' }}>{player.name}</span>}
          </span>
          {isMe && <span className="label" style={{ color: 'var(--green)', fontSize: '0.6rem' }}>YOU</span>}
        </div>
        {clueThisRound && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text)', fontStyle: 'italic', marginTop: '0.1rem' }}>
            &ldquo;{clueThisRound.text}&rdquo;
          </p>
        )}
      </div>
      {player.hasSubmittedClue && player.alive && (
        <span style={{ fontSize: '0.7rem', color: 'var(--green)', letterSpacing: '0.06em' }}>✓</span>
      )}
    </div>
  )
}

function roleColor(role) {
  return role === 'GHOST' ? 'var(--red)' : role === 'VOID' ? 'var(--yellow)' : 'var(--green)'
}
