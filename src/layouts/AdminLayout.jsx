import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  UserRound,
  Users,
  Wallet,
  Tag,
  Settings,
  LogOut,
  Menu,
  X,
  CalendarDays,
  Dumbbell,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const navigation = [
  { name: 'Overview', path: '/admin', icon: LayoutDashboard, end: true },
  { name: 'Payments', path: '/admin/payments', icon: Wallet },
  { name: 'Profile Requests', path: '/admin/profile-requests', icon: UserRound },
  { name: 'Members', path: '/admin/members', icon: Users },
  { name: 'Plans', path: '/admin/plans', icon: Tag },
  {  name: 'Bookings',  path: '/admin/bookings',  icon: CalendarDays,},
  // eslint-disable-next-line no-undef
  {  name: 'Workouts',  path: '/admin/workouts',  icon: Dumbbell,},
  { name: 'Settings', path: '/admin/settings', icon: Settings },
]

function AdminSidebar({ profile, onNavigate, signOut }) {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-all duration-200 ${
      isActive
        ? 'bg-[#FF6B24]/10 font-semibold text-[#FFB347]'
        : 'text-white/50 hover:bg-white/[0.04] hover:text-[#F2E8DC]'
    }`

  return (
    <>
      <NavLink
        to="/admin"
        onClick={onNavigate}
        className="mb-12 inline-flex flex-col leading-[0.85]"
      >
        <span className="text-2xl font-black tracking-[-0.07em] text-[#F2E8DC]">
          PUMPING
        </span>
        <span className="mt-1 bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] bg-clip-text text-2xl font-black tracking-[-0.07em] text-transparent">
          IRON.
        </span>
      </NavLink>

      <p className="mb-4 px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">
        Admin Menu
      </p>

      <nav className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onNavigate}
              className={navLinkClass}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{item.name}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-white/[0.07] pt-6">
        <div className="mb-5 flex items-center gap-3 px-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#303030] text-sm font-semibold text-[#FFB347]">
            {profile?.full_name?.charAt(0)?.toUpperCase() || 'O'}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#F2E8DC]">
              {profile?.full_name || 'Owner'}
            </p>
            <p className="text-xs text-white/35">Owner Account</p>
          </div>
        </div>

        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-white/45 transition-colors hover:bg-red-500/[0.07] hover:text-red-400"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Sign out
        </button>
      </div>
    </>
  )
}

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  async function handleSignOut() {
    const { error } = await signOut()

    if (error) {
      console.error('Sign out failed:', error.message)
      return
    }

    navigate('/login')
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="min-h-screen bg-[#141414] text-[#F2E8DC]">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.07] bg-[#181818] p-7 lg:flex">
        <AdminSidebar
          profile={profile}
          onNavigate={closeMobileMenu}
          signOut={handleSignOut}
        />
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.07] bg-[#181818] px-5 py-4 lg:hidden">
        <NavLink to="/admin" className="flex flex-col leading-[0.85]">
          <span className="text-lg font-black tracking-[-0.07em] text-[#F2E8DC]">
            PUMPING
          </span>
          <span className="mt-1 bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] bg-clip-text text-lg font-black tracking-[-0.07em] text-transparent">
            IRON.
          </span>
        </NavLink>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/[0.05]"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </header>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={closeMobileMenu}
            aria-label="Close navigation"
          />

          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-[#181818] p-7 shadow-2xl">
            <div className="mb-8 flex justify-end">
              <button
                onClick={closeMobileMenu}
                className="rounded-lg p-2 text-white/60 hover:bg-white/[0.05]"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            <AdminSidebar
              profile={profile}
              onNavigate={closeMobileMenu}
              signOut={handleSignOut}
            />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="min-h-screen lg:ml-64">
        <div className="mx-auto w-full max-w-7xl p-5 sm:p-8 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}