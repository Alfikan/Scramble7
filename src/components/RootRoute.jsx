import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loading from './Loading'

/**
 * RootRoute
 *
 * Handles the `/` path with proper auth-aware behavior:
 * - loading  → full-page spinner (no flash of wrong content)
 * - logged in  → redirect to /dashboard
 * - logged out → render the Landing page
 */
export default function RootRoute({ children }) {
  const { currentUser, loading } = useAuth()

  if (loading) return <Loading fullPage />
  if (currentUser) return <Navigate to="/dashboard" replace />
  return children
}
