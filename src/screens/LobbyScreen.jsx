import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useRoom } from '../hooks/useRoom'
import { joinRoom, startGame } from '../firebase/gameService'

export default function LobbyScreen() {
  const { roomCode } = useParams()
  const [searchParams] = useSearchParams()
  const isJoining = searchParams.get('join') === '1'
  const navigate = useNavigate()
  const { room, me, isHost, loading } = useRoom(roomCode)

  const [joinName, setJoinName] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinErr, setJoinErr] = useState('')
  const [copied, setCopied] = useState(false)
  const [starting, setStarting] = useState(false)

  // Redirect when game starts
  useEffect(() => {
    if (!room) return
    if (room.status === 'revealing') navigate(`/reveal/${roomCode}`)
    if (room.status === 'playing') navigate(`/game/${roomCode}`)
  }, [room, roomCode, navigate])

  const handleJoin = async () => {
    if (!joinName.trim()) { setJoinErr('Enter your agent name.'); return }
    setJoining(true)
    setJoinErr('')
    try {
      await joinRoom(roomCode, joinName.trim())
    } catch (e) {
      const map = {
        NO_SUCH_FILE: 'NO SUCH FILE EXISTS',
        ACCESS_DENIED: 'ACCESS DENIED — ROOM FULL',
        IN_PROGRESS: 'MISSION ALREADY IN PROGRESS',
        EXPIRED: 'FILE EXPIRED — MISSION CLOSED',
      }
      setJoinErr(map[e.message] || 'CONNECTION FAILED')
      setJoining(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleStart = async () => {
    if (starting) return
    setStarting(true)
    await startGame(roomCode)
  }

  if (loading) return <LoadingScreen />

  if (isJoining && !me) {
    return (
      <div className="screen">
        <div className="screen-inner">
          <div style={{ textAlign: 'center' }}>
            <div className="logo" style={{ fontSize: '2rem' }}>MASKOFF</div>
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p className="label">JOINING MISSION</p>
            <div className="room-code">{roomCode}</div>
            <input
              placeholder="YOUR AGENT NAME..."
              value={joinName}
              maxLength={20}
              onChange={(e) => { setJoinName(e.target.value); setJoinErr('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            {joinErr && <p className="error-text">{joinErr}</p>}
            {joining ? (
              <div className="terminal-loader"><div className="terminal-spinner" />CONNECTING...</div>
            ) : (
              <button className="btn btn-primary" onClick={handleJoin}>ENTER MISSION</button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const players = room?.players ?? []
  const canStart = isHost && players.length >= 4

  return (
    <div className="screen">
      <div className="screen-inner">
        <div style={{ textAlign: 'center' }}>
          <div className="logo" style={{ fontSize: '2rem' }}>MASKOFF</div>
          <p className="label" style={{ marginTop: '0.4rem' }}>ACTIVE MISSION LOBBY</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          <div className="room-code">{roomCode}</div>
          <p className="tagline" style={{ fontSize: '0.8rem' }}>Share this code with your agents</p>
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: 'auto', marginTop: '0.3rem' }}
            onClick={handleCopy}
          >
            {copied ? '✓ COPIED' : 'COPY CODE'}
          </button>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <p className="label" style={{ marginBottom: '0.75rem' }}>
            AGENTS ASSEMBLED — {players.length} / {room?.settings?.playerCount ?? '?'}
          </p>
          {players.map((p, i) => (
            <DossierLine key={p.id} name={p.name} index={i} isHost={p.isHost} />
          ))}
        </div>

        {isHost ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {!canStart && (
              <p className="label" style={{ textAlign: 'center' }}>
                Need at least 4 agents to begin. ({players.length}/4)
              </p>
            )}
            <button className="btn btn-primary" disabled={!canStart || starting} onClick={handleStart}>
              {starting ? 'INITIATING...' : 'INITIATE MISSION'}
            </button>
          </div>
        ) : (
          <div className="terminal-loader" style={{ justifyContent: 'center' }}>
            <div className="terminal-spinner" />
            Waiting for handler<span className="blink">_</span>
          </div>
        )}
      </div>
    </div>
  )
}

function DossierLine({ name, index, isHost }) {
  return (
    <div
      className="slide-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.6rem 0.75rem',
        background: 'var(--surface2)',
        borderRadius: 'var(--radius)',
        animationDelay: `${index * 0.07}s`,
        opacity: 0,
        animationFillMode: 'forwards',
      }}
    >
      <span className="dot-alive" />
      <span style={{ color: 'var(--manila)', fontWeight: 500, flex: 1 }}>{name}</span>
      {isHost && (
        <span className="label" style={{ color: 'var(--green)', fontSize: '0.65rem' }}>HANDLER</span>
      )}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="terminal-loader">
        <div className="terminal-spinner" />
        CONNECTING...
      </div>
    </div>
  )
}
