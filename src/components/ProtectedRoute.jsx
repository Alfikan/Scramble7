import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loading from './Loading'

/**
 * ProtectedRoute
 *
 * Wraps routes that require authentication.
 * - While Firebase resolves the session: shows a loading screen.
 * - If the user is not logged in: redirects to /login,
 *   preserving the attempted URL so we can redirect back after login.
 * - If the user is logged in: renders the child route.
 */
export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loading fullPage />
  }

  if (!currentUser) {
    // Pass the current location so Login can redirect back after success
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
