import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRoom } from '../firebase/gameService'

export default function CreateRoomScreen() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [playerCount, setPlayerCount] = useState(6)
  const [ghostCount, setGhostCount] = useState(1)
  const [includeVoid, setIncludeVoid] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) { setErr('Enter your agent name.'); return }
    setLoading(true)
    setErr('')
    try {
      const { roomCode } = await createRoom(name.trim(), { playerCount, ghostCount, includeVoid })
      navigate(`/lobby/${roomCode}`)
    } catch (e) {
      setErr('Failed to create room. Check your connection.')
      setLoading(false)
    }
  }

  return (
    <div className="screen">
      <div className="screen-inner">
        <TopBar />

        <h2 style={{ fontFamily: 'var(--font-head)', color: 'var(--manila)', fontSize: '1.6rem' }}>
          NEW MISSION
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label className="label">YOUR AGENT NAME</label>
          <input
            placeholder="AGENT NAME..."
            value={name}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <SettingRow label="AGENTS IN MISSION">
            <div className="stepper">
              <button className="stepper-btn" onClick={() => setPlayerCount((n) => Math.max(4, n - 1))}>−</button>
              <span className="stepper-value">{playerCount}</span>
              <button className="stepper-btn" onClick={() => setPlayerCount((n) => Math.min(10, n + 1))}>+</button>
            </div>
          </SettingRow>

          <div className="divider" />

          <SettingRow label="GHOST OPERATIVES">
            <div className="stepper">
              <button className="stepper-btn" onClick={() => setGhostCount((n) => Math.max(1, n - 1))}>−</button>
              <span className="stepper-value">{ghostCount}</span>
              <button className="stepper-btn" onClick={() => setGhostCount((n) => Math.min(2, n + 1))}>+</button>
            </div>
          </SettingRow>

          <div className="divider" />

          <div className="toggle-wrapper">
            <div>
              <p style={{ color: 'var(--yellow)', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em' }}>
                INCLUDE VOID AGENT
              </p>
              <p className="label" style={{ marginTop: '0.15rem' }}>No intel. No word. No mercy.</p>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={includeVoid} onChange={(e) => setIncludeVoid(e.target.checked)} />
              <span className="toggle-track" />
            </label>
          </div>
        </div>

        {err && <p className="error-text">{err}</p>}

        {loading ? (
          <div className="terminal-loader">
            <div className="terminal-spinner" />
            ESTABLISHING CHANNEL...
          </div>
        ) : (
          <button className="btn btn-primary" onClick={handleCreate}>
            CREATE ROOM
          </button>
        )}
      </div>
    </div>
  )
}

function TopBar() {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <button className="btn btn-ghost btn-sm" style={{ width: 'auto' }} onClick={() => navigate('/')}>
        ← ABORT
      </button>
      <span className="logo" style={{ fontSize: '1.4rem' }}>MASKOFF</span>
    </div>
  )
}

function SettingRow({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
      <p className="label">{label}</p>
      {children}
    </div>
  )
}
