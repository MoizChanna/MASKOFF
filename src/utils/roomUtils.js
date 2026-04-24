export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

export function assignRoles(players, settings, assetWord, ghostWord) {
  const { ghostCount = 1, includeVoid = false } = settings

  const roles = []
  for (let i = 0; i < ghostCount; i++) roles.push('GHOST')
  if (includeVoid) roles.push('VOID')
  while (roles.length < players.length) roles.push('ASSET')
  roles.sort(() => Math.random() - 0.5)

  return players.map((player, i) => ({
    ...player,
    role: roles[i],
    word: roles[i] === 'GHOST' ? ghostWord : roles[i] === 'VOID' ? '???' : assetWord,
  }))
}

export function getStoredPlayerId(roomCode) {
  return sessionStorage.getItem(`maskoff_${roomCode}`)
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
