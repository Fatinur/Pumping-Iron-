import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#141414] text-[#F2E8DC]">
        Loading...
      </div>
    )
  }

  // Require authentication
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Require a loaded profile
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#141414] px-6 text-center text-[#F2E8DC]">
        Unable to load your profile. Please try signing out and signing in again.
      </div>
    )
  }

  // Check the user's role
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }

  return children
}