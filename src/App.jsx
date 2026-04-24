import { Routes, Route, Navigate } from 'react-router-dom'
import HomeScreen from './screens/HomeScreen'
import CreateRoomScreen from './screens/CreateRoomScreen'
import LobbyScreen from './screens/LobbyScreen'
import RoleRevealScreen from './screens/RoleRevealScreen'
import GameScreen from './screens/GameScreen'
import VotingScreen from './screens/VotingScreen'
import EndScreen from './screens/EndScreen'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/create" element={<CreateRoomScreen />} />
      <Route path="/lobby/:roomCode" element={<LobbyScreen />} />
      <Route path="/reveal/:roomCode" element={<RoleRevealScreen />} />
      <Route path="/game/:roomCode" element={<GameScreen />} />
      <Route path="/vote/:roomCode" element={<VotingScreen />} />
      <Route path="/end/:roomCode" element={<EndScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
