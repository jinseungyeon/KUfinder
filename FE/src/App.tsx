import { Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import AdminPage from './pages/AdminPage'
import FoundRegisterPage from './pages/FoundRegisterPage'
import HomePage from './pages/HomePage'
import LostRegisterPage from './pages/LostRegisterPage'
import MapPage from './pages/MapPage'
import MatchingPage from './pages/MatchingPage'
import MatchResultPage from './pages/MatchResultPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <div className="page-shell">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/found/register" element={<FoundRegisterPage />} />
        <Route path="/lost/register" element={<LostRegisterPage />} />
        <Route path="/matching" element={<MatchingPage />} />
        <Route path="/matches/:lostItemId" element={<MatchResultPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}
