
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { RefreshCw, Search, Eye } from 'lucide-react'

const EXPIRING_SOON_DAYS = 7

function daysLeftFrom(endDate) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(`${endDate}T00:00:00`)
  return Math.round((end - today) / 86400000)
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString()
}

function plural(n) {
  return n === 1 ? '' : 's'
}

function getStatus(membership) {
  if (!membership) {
    return { key: 'none', label: 'No membership', daysText: '—' }
  }

  if (membership.status === 'active' && membership.is_lifetime_snapshot) {
    return { key: 'active', label: 'Lifetime', daysText: 'Lifetime' }
  }

  if (membership.status === 'active' && membership.end_date) {
    const days = daysLeftFrom(membership.end_date)

    if (days < 0) {
      return {
        key: 'expired',
        label: 'Expired',
        daysText: `Expired ${Math.abs(days)} day${plural(Math.abs(days))} ago`,
      }
    }

    if (days <= EXPIRING_SOON_DAYS) {
      return {
        key: 'expiring',
        label: 'Expiring soon',
        daysText: days === 0 ? 'Ends today' : `${days} day${plural(days)} left`,
      }
    }

    return {
      key: 'active',
      label: 'Active',
      daysText: `${days} days left`,
    }
  }

  return { key: 'expired', label: 'Expired', daysText: 'No active period' }
}

const badgeClass = {
  active: 'bg-green-500/10 text-green-400',
  expiring: 'bg-yellow-500/10 text-yellow-400',
  expired: 'bg-red-500/10 text-red-400',
  none: 'bg-white/[0.06] text-white/50',
}

const filters = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'expiring', label: 'Expiring soon' },
  { key: 'expired', label: 'Expired' },
  { key: 'none', label: 'No membership' },
]

export default function AdminMembers() {
  const navigate = useNavigate()

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadMembers()
  }, [])

  async function loadMembers() {
    setLoading(true)
    setError('')

    const [profilesResult, membershipsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, phone, created_at')
        .eq('role', 'member')
        .order('full_name', { ascending: true }),

      supabase
        .from('memberships')
        .select(
          'user_id, plan_name_snapshot, start_date, end_date, status, is_lifetime_snapshot, created_at',
        )
        .in('status', ['active', 'expired', 'renewed'])
        .order('created_at', { ascending: false }),
    ])

    if (profilesResult.error || membershipsResult.error) {
      setError(
        profilesResult.error?.message ||
          membershipsResult.error?.message ||
          'Failed to load members.',
      )
      setMembers([])
      setLoading(false)
      return
    }

    const byUser = {}

    for (const m of membershipsResult.data || []) {
      if (!byUser[m.user_id]) byUser[m.user_id] = []
      byUser[m.user_id].push(m)
    }

    const combined = (profilesResult.data || []).map((profile) => {
      const list = byUser[profile.id] || []
      const current = list.find((m) => m.status === 'active') || list[0] || null

      return {
        ...profile,
        membership: current,
        status: getStatus(current),
      }
    })

    setMembers(combined)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-[#F2E8DC]/50">
        Loading members...
      </div>
    )
  }

  const count = (key) => members.filter((m) => m.status.key === key).length

  const visible = members.filter((m) => {
    if (filter !== 'all' && m.status.key !== filter) return false

    const q = search.trim().toLowerCase()
    if (!q) return true

    return (
      (m.full_name || '').toLowerCase().includes(q) ||
      (m.phone || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-9">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF8248]">
            Administration
          </p>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Members
          </h1>

          <p className="mt-3 text-sm text-white/45">
            Everyone who has registered, with their membership status.
          </p>
        </div>

        <button
          onClick={loadMembers}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm font-bold text-[#F2E8DC] transition hover:bg-white/5"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-white/[0.07] bg-[#181818] p-5">
          <p className="text-sm text-white/45">Total members</p>
          <p className="mt-3 text-3xl font-black text-[#F2E8DC]">
            {members.length}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#181818] p-5">
          <p className="text-sm text-white/45">Active</p>
          <p className="mt-3 text-3xl font-black text-green-400">
            {count('active') + count('expiring')}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#181818] p-5">
          <p className="text-sm text-white/45">
            Expiring within {EXPIRING_SOON_DAYS} days
          </p>
          <p className="mt-3 text-3xl font-black text-yellow-400">
            {count('expiring')}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#181818] p-5">
          <p className="text-sm text-white/45">Expired</p>
          <p className="mt-3 text-3xl font-black text-red-400">
            {count('expired')}
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone"
              className="w-full rounded-lg border border-white/[0.09] bg-[#202020] py-3 pl-11 pr-4 text-sm text-[#F2E8DC] placeholder:text-white/25 outline-none transition-all duration-200 focus:border-[#FF6B24]/70 focus:ring-2 focus:ring-[#FF6B24]/10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-lg px-4 py-3 text-sm transition-colors ${
                  filter === f.key
                    ? 'bg-[#FF6B24]/10 font-semibold text-[#FFB347]'
                    : 'text-white/50 hover:bg-white/[0.04] hover:text-[#F2E8DC]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Members List */}
        {visible.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] bg-[#181818] px-6 py-10 text-center text-sm text-white/40">
            No members match.
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-[#181818] px-5 py-4"
              >
                {/* Member Information */}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#F2E8DC]">
                    {m.full_name || 'Unnamed member'}
                  </p>

                  <p className="mt-1 text-xs text-white/40">
                    {m.phone || 'No phone on file'}
                  </p>
                </div>

                {/* Membership */}
                <div className="min-w-[150px] text-sm text-white/60">
                  <p className="font-medium text-[#F2E8DC]">
                    {m.membership?.plan_name_snapshot || '—'}
                  </p>

                  <p className="mt-1 text-xs text-white/40">
                    {m.membership?.is_lifetime_snapshot
                      ? 'Never expires'
                      : m.membership
                        ? `Valid until ${formatDate(m.membership.end_date)}`
                        : 'Has not purchased a plan'}
                  </p>
                </div>

                {/* Status and Details */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#F2E8DC]">
                      {m.status.daysText}
                    </p>

                    <span
                      className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold ${badgeClass[m.status.key]}`}
                    >
                      {m.status.label}
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/admin/members/${m.id}`)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#FF6B24]/30 bg-[#FF6B24]/[0.08] px-4 py-3 text-xs font-bold text-[#F2E8DC] transition hover:border-[#FF6B24]/60 hover:bg-[#FF6B24]/15"
                  >
                    <Eye size={15} />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
