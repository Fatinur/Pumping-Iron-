
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ProtectedRoute from './components/ProtectedRoute'

import MemberLayout from './layouts/MemberLayout'
import MemberOverview from './pages/MemberOverview'
import MemberMembership from './pages/MemberMembership'
import MemberBooking from './pages/MemberBooking'
import MemberWorkouts from './pages/MemberWorkouts'
import MemberProfile from './pages/MemberProfile'

import AdminLayout from './layouts/AdminLayout'
import AdminOverview from './pages/AdminOverview'
import AdminProfileRequests from './pages/AdminProfileRequests'
import AdminPayments from './pages/AdminPayments'
import AdminMembers from './pages/AdminMembers'
import AdminPlans from './pages/AdminPlans'
import AdminSettings from './pages/AdminSettings'
import AdminBookings from './pages/AdminBookings'
import AdminWorkouts from './pages/AdminWorkouts'
import AdminMemberDetails from './pages/AdminMemberDetails'

function App() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#141414] text-[#F2E8DC]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#FF6B24]/20 border-t-[#FF6B24]" />
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#F2E8DC]/50">
            PUMPING IRON
          </p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user && profile?.role === 'owner' ? (
            <Navigate to="/admin" replace />
          ) : user && profile?.role === 'member' ? (
            <Navigate to="/member" replace />
          ) : (
            <Home />
          )
        }
      />

      <Route
        path="/register"
        element={user ? <Navigate to="/" replace /> : <Register />}
      />

      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />

      <Route
        path="/forgot-password"
        element={user ? <Navigate to="/" replace /> : <ForgotPassword />}
      />

      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/member"
        element={
          <ProtectedRoute allowedRoles={['member']}>
            <MemberLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MemberOverview />} />
        <Route path="membership" element={<MemberMembership />} />
        <Route path="booking" element={<MemberBooking />} />
        <Route path="workouts" element={<MemberWorkouts />} />
        <Route path="profile" element={<MemberProfile />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="profile-requests" element={<AdminProfileRequests />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="members" element={<AdminMembers />} />
        <Route path="members/:memberId" element={<AdminMemberDetails />} />
        <Route path="plans" element={<AdminPlans />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="workouts" element={<AdminWorkouts />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
