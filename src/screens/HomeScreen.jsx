import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const patternStyle = {
  position: 'absolute',
  inset: 0,
  backgroundImage: `repeating-linear-gradient(
    180deg,
    transparent 0px,
    transparent 28px,
    rgba(245,230,200,0.04) 28px,
    rgba(245,230,200,0.04) 30px
  )`,
  pointerEvents: 'none',
  zIndex: 0,
}

export default function HomeScreen() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 4) {
      setErr('Enter a 4-letter room code.')
      return
    }
    navigate(`/lobby/${trimmed}?join=1`)
  }

  return (
    <div className="screen" style={{ justifyContent: 'center', textAlign: 'center', gap: '2.5rem', position: 'relative' }}>
      <div aria-hidden style={patternStyle} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="logo glitch">MASKOFF</div>
        <p className="tagline" style={{ marginTop: '0.75rem' }}>
          — Everyone&apos;s hiding something. —
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 1 }}>
        <button className="btn btn-primary" onClick={() => navigate('/create')}>
          CREATE ROOM
        </button>

        <div className="divider" />

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            placeholder="ROOM CODE"
            value={code}
            maxLength={4}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setErr('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            style={{
              textAlign: 'center',
              letterSpacing: '0.25em',
              fontWeight: 700,
              fontSize: '1.3rem',
              flex: 1,
            }}
          />
          <button
            className="btn btn-danger"
            style={{ width: 'auto', whiteSpace: 'nowrap', padding: '0 1.25rem' }}
            onClick={handleJoin}
          >
            JOIN
          </button>
        </div>

        {err && <p className="error-text">{err}</p>}
      </div>

      <p className="label" style={{ position: 'absolute', bottom: '1.5rem', zIndex: 1 }}>
        CLASSIFIED — FOR AUTHORIZED AGENTS ONLY
      </p>
    </div>
  )
}
