import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loading from './Loading'

/**
 * PublicOnlyRoute
 *
 * Wraps routes that should only be accessible when logged OUT
 * (Login, Signup).
 * - While Firebase resolves the session: shows a loading screen.
 * - If the user IS logged in: redirects to /dashboard.
 * - If the user is NOT logged in: renders the child route.
 */
export default function PublicOnlyRoute({ children }) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return <Loading fullPage />
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
