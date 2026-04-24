import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoom } from '../hooks/useRoom'
import { resetRoom } from '../firebase/gameService'
import { useSound } from '../hooks/useSound'
import { getInitials } from '../utils/roomUtils'

const WIN_CONFIG = {
  assets: {
    stampClass: 'stamp-green',
    stampText: 'MISSION COMPLETE',
    subtitle: 'The Ghost has been unmasked.',
    color: 'var(--green)',
  },
  ghost: {
    stampClass: 'stamp-red',
    stampText: 'MISSION FAILED',
    subtitle: 'The Ghost was never caught.',
    color: 'var(--red)',
  },
  void: {
    stampClass: 'stamp-yellow',
    stampText: 'IDENTITY UNKNOWN',
    subtitle: 'The Void slipped through.',
    color: 'var(--yellow)',
  },
}

export default function EndScreen() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { room, isHost, loading } = useRoom(roomCode)
  const { playSound } = useSound()
  const confettiRef = useRef(null)
  const confettiStarted = useRef(false)

  useEffect(() => {
    if (!room?.winner || confettiStarted.current) return
    confettiStarted.current = true
    playSound('win')
    launchConfetti(confettiRef.current, room.winner)
  }, [room?.winner, playSound])

  // When host resets the room, all clients redirect to lobby automatically
  useEffect(() => {
    if (!room) return
    if (room.status === 'lobby') navigate(`/lobby/${roomCode}`)
  }, [room, roomCode, navigate])

  if (loading || !room) {
    return (
      <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="terminal-loader"><div className="terminal-spinner" />LOADING...</div>
      </div>
    )
  }

  const cfg = WIN_CONFIG[room.winner] ?? WIN_CONFIG.assets

  const handleNewMission = async () => {
    if (isHost) {
      await resetRoom(roomCode)
      // useEffect above redirects all clients to lobby once status flips to 'lobby'
    }
  }

  return (
    <div className="screen" style={{ gap: '2rem' }}>
      <canvas ref={confettiRef} id="confetti-canvas" />

      <div style={{ textAlign: 'center' }}>
        <div className="logo" style={{ fontSize: '2rem' }}>MASKOFF</div>
      </div>

      {/* Win stamp */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
        <div className={`stamp ${cfg.stampClass} stamp-slam`} style={{ fontSize: 'clamp(1.4rem, 6vw, 2.2rem)', display: 'inline-block' }}>
          {cfg.stampText}
        </div>
        <p style={{ color: cfg.color, fontFamily: 'var(--font-mono)', fontSize: '1rem', fontStyle: 'italic' }}>
          {cfg.subtitle}
        </p>
      </div>

      {/* Dossier reveal */}
      <div style={{ width: '100%', maxWidth: 480 }}>
        <p className="label" style={{ marginBottom: '0.75rem', textAlign: 'center' }}>
          — DOSSIER DECLASSIFIED —
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {room.players.map((p, i) => (
            <DossierCard key={p.id} player={p} index={i} />
          ))}
        </div>
      </div>

      {/* Words revealed */}
      <div className="card" style={{ width: '100%', maxWidth: 480, display: 'flex', gap: '2rem', justifyContent: 'center', textAlign: 'center' }}>
        <div>
          <p className="label">ASSET WORD</p>
          <p style={{ color: 'var(--green)', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1.4rem', marginTop: '0.25rem' }}>
            {room.assetWord}
          </p>
        </div>
        <div style={{ width: 1, background: 'var(--muted)' }} />
        <div>
          <p className="label">GHOST WORD</p>
          <p style={{ color: 'var(--red)', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1.4rem', marginTop: '0.25rem' }}>
            {room.ghostWord}
          </p>
        </div>
      </div>

      {isHost ? (
        <button className="btn btn-primary" style={{ maxWidth: 480, width: '100%' }} onClick={handleNewMission}>
          NEW MISSION
        </button>
      ) : (
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div className="terminal-loader" style={{ justifyContent: 'center', marginBottom: '0.75rem' }}>
            <div className="terminal-spinner" />
            Waiting for handler to start new mission<span className="blink">_</span>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width: 'auto' }} onClick={() => navigate('/')}>
            ← LEAVE MISSION
          </button>
        </div>
      )}
    </div>
  )
}

function DossierCard({ player, index }) {
  const roleColor = player.role === 'GHOST' ? 'var(--red)' : player.role === 'VOID' ? 'var(--yellow)' : 'var(--green)'

  return (
    <div
      className="slide-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.65rem 0.9rem',
        background: 'var(--surface)',
        border: `1px solid ${roleColor}33`,
        borderRadius: 'var(--radius)',
        animationDelay: `${index * 0.08}s`,
        opacity: 0,
        animationFillMode: 'forwards',
      }}
    >
      <div style={{
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: roleColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#090910',
        fontFamily: 'var(--font-head)',
        fontWeight: 800,
        fontSize: '0.85rem',
        flexShrink: 0,
      }}>
        {getInitials(player.name)}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ color: 'var(--manila)', fontWeight: 600, fontSize: '0.95rem' }}>{player.name}</p>
        <p style={{ fontSize: '0.72rem', color: roleColor, letterSpacing: '0.08em' }}>{player.role?.toUpperCase()}</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text)', fontStyle: 'italic' }}>
          {player.word ?? '???'}
        </p>
        {!player.alive && (
          <p style={{ fontSize: '0.65rem', color: 'var(--red)', letterSpacing: '0.06em' }}>ELIMINATED</p>
        )}
      </div>
    </div>
  )
}

// ── Minimal canvas confetti ───────────────────────────────────────────────────
function launchConfetti(canvas, winner) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const colors = {
    assets: ['#2EFF9A', '#F5E6C8', '#ffffff'],
    ghost: ['#E63946', '#F5E6C8', '#ff8888'],
    void: ['#F8E05C', '#F5E6C8', '#ffffff'],
  }[winner] ?? ['#2EFF9A', '#E63946', '#F5E6C8']

  const particles = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -20,
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 4 + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 6,
    life: 1,
  }))

  let frame = 0
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    particles.forEach((p) => {
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.rotationSpeed
      p.life -= 0.004
      ctx.save()
      ctx.globalAlpha = Math.max(0, p.life)
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      ctx.restore()
    })
    frame++
    if (frame < 200) requestAnimationFrame(draw)
    else ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
  draw()
}
