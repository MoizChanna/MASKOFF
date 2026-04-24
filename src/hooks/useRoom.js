import { useEffect, useState } from 'react'
import { subscribeToRoom } from '../firebase/gameService'
import { getStoredPlayerId } from '../utils/roomUtils'

export function useRoom(roomCode) {
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const playerId = getStoredPlayerId(roomCode)

  useEffect(() => {
    if (!roomCode) return
    const unsub = subscribeToRoom(roomCode, (data) => {
      setRoom(data)
      setLoading(false)
    })
    return unsub
  }, [roomCode])

  const me = room?.players?.find((p) => p.id === playerId) ?? null
  const isHost = me?.isHost ?? false

  return { room, me, isHost, loading, error, playerId }
}
