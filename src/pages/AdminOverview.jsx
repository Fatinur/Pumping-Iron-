
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  UserRound,
  CreditCard,
  Clock,
  CalendarDays,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Dumbbell,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const EXPIRING_SOON_DAYS = 7

function getLocalDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getMonthBoundaries() {
  const now = new Date()

  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function AdminOverview() {
  const [stats, setStats] = useState({
    members: null,
    activeMemberships: null,
    monthlyRevenue: null,
    pendingPayments: null,
    expiringSoon: null,
    todayBookings: null,
    pendingRequests: null,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadStats() {
    setLoading(true)
    setError('')

    const today = getLocalDate()

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + EXPIRING_SOON_DAYS)
    const expiringDate = getLocalDate(futureDate)

    const { start: monthStart, end: monthEnd } =
      getMonthBoundaries()

    const [
      membersResult,
      activeResult,
      revenueResult,
      pendingPaymentsResult,
      expiringResult,
      bookingsResult,
      requestsResult,
    ] = await Promise.all([
      // Total registered members
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member'),

      // Currently active memberships
      supabase
        .from('memberships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .or(
          `is_lifetime_snapshot.eq.true,end_date.gte.${today}`,
        ),

      // Confirmed revenue collected this month
      supabase
        .from('payments')
        .select('amount')
        .eq('status', 'confirmed')
        .gte('confirmed_at', monthStart)
        .lt('confirmed_at', monthEnd),

      // Payments awaiting owner confirmation
      supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),

      // Memberships expiring within 7 days
      supabase
        .from('memberships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('is_lifetime_snapshot', false)
        .gte('end_date', today)
        .lte('end_date', expiringDate),

      // Today's booked slots
      supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('booking_date', today)
        .eq('status', 'booked'),

      // Pending profile change requests
      supabase
        .from('profile_change_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ])

    const results = [
      membersResult,
      activeResult,
      revenueResult,
      pendingPaymentsResult,
      expiringResult,
      bookingsResult,
      requestsResult,
    ]

    const failedResult = results.find((result) => result.error)

    if (failedResult) {
      setError(failedResult.error.message)
      setLoading(false)
      return
    }

    const monthlyRevenue = (revenueResult.data || []).reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0,
    )

    setStats({
      members: membersResult.count ?? 0,
      activeMemberships: activeResult.count ?? 0,
      monthlyRevenue,
      pendingPayments: pendingPaymentsResult.count ?? 0,
      expiringSoon: expiringResult.count ?? 0,
      todayBookings: bookingsResult.count ?? 0,
      pendingRequests: requestsResult.count ?? 0,
    })

    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats()
  }, [])

  const cards = [
    {
      title: 'Total Members',
      value: stats.members,
      icon: Users,
      description: 'Registered gym members',
      color: 'text-[#FFB347]',
      link: '/admin/members',
    },
    {
      title: 'Active Memberships',
      value: stats.activeMemberships,
      icon: Dumbbell,
      description: 'Currently valid memberships',
      color: 'text-emerald-400',
      link: '/admin/members',
    },
    {
      title: 'Monthly Revenue',
      value:
        stats.monthlyRevenue === null
          ? null
          : formatCurrency(stats.monthlyRevenue),
      icon: TrendingUp,
      description: 'Confirmed payments this month',
      color: 'text-[#FFB347]',
      link: '/admin/payments',
    },
    {
      title: 'Pending Payments',
      value: stats.pendingPayments,
      icon: CreditCard,
      description: 'Awaiting confirmation',
      color: 'text-yellow-400',
      link: '/admin/payments',
    },
    {
      title: 'Expiring Soon',
      value: stats.expiringSoon,
      icon: Clock,
      description: 'Memberships ending within 7 days',
      color: 'text-orange-400',
      link: '/admin/members',
    },
    {
      title: "Today's Bookings",
      value: stats.todayBookings,
      icon: CalendarDays,
      description: 'Confirmed time slots today',
      color: 'text-blue-400',
      link: '/admin/bookings',
    },
  ]

  return (
    <div className="space-y-9">
      {/* Header */}
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF8248]">
            Administration
          </p>

          <h1 className="text-3xl font-black tracking-tight text-[#F2E8DC] sm:text-4xl">
            Owner{' '}
            <span className="bg-gradient-to-r from-[#FFB347] to-[#D94A36] bg-clip-text text-transparent">
              Dashboard.
            </span>
          </h1>

          <p className="mt-3 text-sm text-white/45">
            Your gym's performance and daily activity at a glance.
          </p>
        </div>

        <button
          type="button"
          onClick={loadStats}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#202020] px-4 py-2.5 text-sm font-bold text-[#F2E8DC] transition hover:border-[#FF6B24]/40 hover:bg-[#292929] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          Failed to load dashboard: {error}
        </div>
      )}

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon

          return (
            <Link
              key={card.title}
              to={card.link}
              className="group rounded-xl border border-white/[0.07] bg-[#181818] p-5 transition hover:border-[#FF6B24]/30 hover:bg-[#1D1D1D]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white/50">
                  {card.title}
                </span>

                <Icon size={19} className={card.color} />
              </div>

              <p className="mt-5 text-3xl font-black text-[#F2E8DC]">
                {loading
                  ? '—'
                  : card.value ?? '—'}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-white/35">
                  {card.description}
                </span>

                <ArrowRight
                  size={15}
                  className="text-white/25 transition group-hover:translate-x-1 group-hover:text-[#FFB347]"
                />
              </div>
            </Link>
          )
        })}
      </section>

      {/* Pending requests */}
      <section className="rounded-xl border border-white/[0.07] bg-[#181818] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF6B24]/10">
              <UserRound size={21} className="text-[#FFB347]" />
            </div>

            <div>
              <h2 className="font-bold text-[#F2E8DC]">
                Profile Change Requests
              </h2>

              <p className="mt-1 text-xs text-white/40">
                Review member information changes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-2xl font-black text-[#FF6B24]">
              {loading ? '—' : stats.pendingRequests}
            </span>

            <Link
              to="/admin/profile-requests"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FF6B24] to-[#D94A36] px-4 py-2.5 text-sm font-bold text-[#F2E8DC] transition hover:brightness-110"
            >
              Review <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
