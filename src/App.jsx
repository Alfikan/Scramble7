import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import RootRoute from './components/RootRoute'

// Pages
import Landing    from './pages/Landing'
import Login      from './pages/Login'
import Signup     from './pages/Signup'
import Dashboard  from './pages/Dashboard'
import Room       from './pages/Room'
import QuizSetup  from './pages/QuizSetup'
import Quiz       from './pages/Quiz'
import QuizResult from './pages/QuizResult'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Root: shows Landing to guests, redirects logged-in users to /dashboard */}
          <Route path="/" element={<RootRoute><Landing /></RootRoute>} />

          {/* Public-only: redirect to /dashboard if already logged in */}
          <Route path="/login"  element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />

          {/* Protected: redirect to /login if not authenticated */}
          <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/room/:roomId" element={<ProtectedRoute><Room /></ProtectedRoute>} />
          <Route path="/quiz/setup"   element={<ProtectedRoute><QuizSetup /></ProtectedRoute>} />
          <Route path="/quiz"         element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
          <Route path="/quiz/result"  element={<ProtectedRoute><QuizResult /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
