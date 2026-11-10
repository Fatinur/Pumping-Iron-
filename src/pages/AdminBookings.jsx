
import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Save,
  Plus,
  Trash2,
  Settings2,
  AlertCircle,
  CalendarX,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const weekdays = [
  { weekday: 1, name: 'Monday' },
  { weekday: 2, name: 'Tuesday' },
  { weekday: 3, name: 'Wednesday' },
  { weekday: 4, name: 'Thursday' },
  { weekday: 5, name: 'Friday' },
  { weekday: 6, name: 'Saturday' },
  { weekday: 7, name: 'Sunday' },
]

function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-BD', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(time) {
  if (!time) return ''

  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)

  return date.toLocaleTimeString('en-BD', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getCrowdStyle(level) {
  switch (level?.toLowerCase()) {
    case 'low':
      return 'bg-green-500/10 text-green-400'
    case 'moderate':
      return 'bg-yellow-500/10 text-yellow-400'
    case 'busy':
      return 'bg-red-500/10 text-red-400'
    default:
      return 'bg-white/10 text-white/50'
  }
}

const inputClass =
  'w-full rounded-lg border border-white/10 bg-[#202020] px-4 py-3 text-sm text-[#F2E8DC] outline-none transition focus:border-[#FF6B24]/60'

const labelClass =
  'mb-2 block text-xs font-bold uppercase tracking-wider text-white/40'

export default function AdminBookings() {
  const [selectedDate, setSelectedDate] = useState(getToday())

  const [hours, setHours] = useState([])
  const [closures, setClosures] = useState([])
  const [slots, setSlots] = useState([])
  const [bookings, setBookings] = useState([])

  const [closureDate, setClosureDate] = useState('')
  const [closureReason, setClosureReason] = useState('')

  const [loading, setLoading] = useState(true)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [savingHours, setSavingHours] = useState(false)
  const [savingClosure, setSavingClosure] = useState(false)
  const [actionLoading, setActionLoading] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // Load operating hours and upcoming closures.
  useEffect(() => {
    let mounted = true

    async function loadSettings() {
      setSettingsLoading(true)

      const [hoursResult, closuresResult] = await Promise.all([
        supabase
          .from('gym_operating_hours')
          .select('*')
          .order('weekday'),

        supabase
          .from('gym_closures')
          .select('*')
          .gte('closure_date', getToday())
          .order('closure_date'),
      ])

      if (!mounted) return

      if (hoursResult.error || closuresResult.error) {
        setError(
          hoursResult.error?.message ||
            closuresResult.error?.message
        )
        setSettingsLoading(false)
        return
      }

      setHours(hoursResult.data || [])
      setClosures(closuresResult.data || [])
      setSettingsLoading(false)
    }

    loadSettings()

    return () => {
      mounted = false
    }
  }, [refreshKey])

  // Load bookings and crowd information for selected date.
  useEffect(() => {
    let mounted = true

    async function loadBookings() {
      setLoading(true)
      setError('')

      const [crowdsResult, bookingsResult] = await Promise.all([
        supabase.rpc('get_slot_crowds', {
          p_booking_date: selectedDate,
        }),

        supabase
          .from('bookings')
          .select('*')
          .eq('booking_date', selectedDate)
          .order('start_time'),
      ])

      if (!mounted) return

      if (crowdsResult.error || bookingsResult.error) {
        setError(
          crowdsResult.error?.message ||
            bookingsResult.error?.message
        )
        setLoading(false)
        return
      }

      const bookingData = bookingsResult.data || []
      const userIds = [
        ...new Set(bookingData.map((booking) => booking.user_id)),
      ]

      let profileMap = {}

      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', userIds)

        if (!mounted) return

        if (profileError) {
          setError(profileError.message)
          setLoading(false)
          return
        }

        profileMap = Object.fromEntries(
          (profiles || []).map((profile) => [
            profile.id,
            profile,
          ])
        )
      }

      if (!mounted) return

      setSlots(crowdsResult.data || [])

      setBookings(
        bookingData.map((booking) => ({
          ...booking,
          profile: profileMap[booking.user_id] || null,
        }))
      )

      setLoading(false)
    }

    loadBookings()

    return () => {
      mounted = false
    }
  }, [selectedDate, refreshKey])

  function updateHour(weekday, field, value) {
    setHours((current) =>
      current.map((day) =>
        day.weekday === weekday
          ? { ...day, [field]: value }
          : day
      )
    )
  }

  async function handleSaveHours() {
    setError('')
    setSuccess('')

    if (hours.length !== 7) {
      setError('All seven days must have operating-hour records.')
      return
    }

    for (const day of hours) {
      if (day.is_closed) continue

      if (!day.open_time || !day.close_time) {
        setError(
          `Please set both times for ${weekdays[day.weekday - 1].name}.`
        )
        return
      }

      if (
        day.open_time.slice(3, 5) !== '00' ||
        day.close_time.slice(3, 5) !== '00'
      ) {
        setError('Operating hours must use full-hour times (e.g. 06:00).')
        return
      }

      if (day.close_time <= day.open_time) {
        setError(
          `Closing time must be later than opening time on ${weekdays[day.weekday - 1].name}.`
        )
        return
      }
    }

    setSavingHours(true)

    for (const day of hours) {
      const { data, error: updateError } = await supabase
        .from('gym_operating_hours')
        .update({
          open_time: day.open_time || null,
          close_time: day.close_time || null,
          is_closed: day.is_closed,
        })
        .eq('weekday', day.weekday)
        .select('weekday')

      if (updateError || !data?.length) {
        setError(
          updateError?.message ||
            `Could not save ${weekdays[day.weekday - 1].name}.`
        )
        setSavingHours(false)
        return
      }
    }

    setSavingHours(false)
    setSuccess('Operating hours saved successfully.')
    setRefreshKey((current) => current + 1)
  }

  async function handleAddClosure(e) {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (!closureDate) {
      setError('Please select a closure date.')
      return
    }

    if (closureDate < getToday()) {
      setError('You cannot add a closure for a past date.')
      return
    }

    setSavingClosure(true)

    const { error: insertError } = await supabase
      .from('gym_closures')
      .insert({
        closure_date: closureDate,
        reason: closureReason.trim() || null,
      })

    setSavingClosure(false)

    if (insertError) {
      setError(
        insertError.code === '23505'
          ? 'A closure already exists for this date.'
          : insertError.message
      )
      return
    }

    setSuccess('Gym closure added successfully.')
    setClosureDate('')
    setClosureReason('')
    setRefreshKey((current) => current + 1)
  }

  async function handleDeleteClosure(id) {
    const confirmed = window.confirm(
      'Are you sure you want to remove this closure?'
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    const { error: deleteError } = await supabase
      .from('gym_closures')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setSuccess('Closure removed.')
    setRefreshKey((current) => current + 1)
  }

  async function handleCancelBooking(booking) {
    const confirmed = window.confirm(
      `Cancel the booking for ${booking.profile?.full_name || 'this member'}?`
    )

    if (!confirmed) return

    setActionLoading(booking.id)
    setError('')
    setSuccess('')

    const { error: cancelError } = await supabase.rpc(
      'cancel_gym_booking',
      {
        p_booking_id: booking.id,
      }
    )

    setActionLoading('')

    if (cancelError) {
      setError(cancelError.message)
      return
    }

    setSuccess('Booking cancelled successfully.')
    setRefreshKey((current) => current + 1)
  }

  const bookedCount = bookings.filter(
    (booking) => booking.status === 'booked'
  ).length

  const totalSlots = slots.length

  const selectedWeekday = (() => {
    const weekday = new Date(
      `${selectedDate}T00:00:00`
    ).getDay()

    return weekday === 0 ? 7 : weekday
  })()

  const isClosed =
    hours.find((day) => day.weekday === selectedWeekday)?.is_closed ||
    closures.some((closure) => closure.closure_date === selectedDate)

  return (
    <div className="space-y-9">
      {/* Header */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#FF8248]">
          Gym administration
        </p>

        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Bookings
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
          Manage your gym schedule, monitor reservations and control
          operating hours.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
          <CheckCircle2 size={18} className="shrink-0" />
          {success}
        </div>
      )}

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/[0.07] bg-[#181818] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/45">Active bookings</p>
            <Users className="text-[#FF8248]" size={20} />
          </div>

          <p className="mt-4 text-3xl font-black">
            {loading ? '—' : bookedCount}
          </p>

          <p className="mt-1 text-xs text-white/30">
            For the selected date
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#181818] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/45">Available time slots</p>
            <Clock className="text-[#FF8248]" size={20} />
          </div>

          <p className="mt-4 text-3xl font-black">
            {loading ? '—' : totalSlots}
          </p>

          <p className="mt-1 text-xs text-white/30">
            For the selected date
          </p>
        </div>
      </div>

      {/* Daily bookings */}
      <section className="space-y-5 rounded-xl border border-white/[0.07] bg-[#181818] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="text-[#FF8248]" size={19} />
              <h2 className="text-lg font-bold">Daily bookings</h2>
            </div>

            <p className="mt-2 text-xs text-white/35">
              View reservations and crowd levels by date.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRefreshKey((current) => current + 1)}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white/60 transition hover:bg-white/5 hover:text-white"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        <div className="max-w-sm">
          <label className={labelClass}>Select date</label>
          <input
            type="date"
            value={selectedDate}
            min={getToday()}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <p className="text-sm font-semibold text-[#FFB347]">
          {formatDate(selectedDate)}
        </p>

        {isClosed ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
            <CalendarX className="mx-auto mb-3 text-red-400" size={28} />
            <p className="font-bold">Gym closed on this date</p>
            <p className="mt-2 text-xs text-white/40">
              No new booking slots are available.
            </p>
          </div>
        ) : loading ? (
          <div className="flex min-h-40 items-center justify-center text-sm text-white/40">
            <RefreshCw className="mr-3 animate-spin" size={18} />
            Loading bookings...
          </div>
        ) : slots.length === 0 ? (
          <div className="rounded-xl bg-[#202020] p-6 text-center text-sm text-white/40">
            No booking slots are configured for this date.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="rounded-full bg-green-500/10 px-3 py-1 text-green-400">
                Low: 0–4
              </span>
              <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-yellow-400">
                Moderate: 5–9
              </span>
              <span className="rounded-full bg-red-500/10 px-3 py-1 text-red-400">
                Busy: 10+
              </span>
            </div>

            {slots.map((slot) => {
              const slotBookings = bookings.filter(
                (booking) =>
                  booking.start_time === slot.slot_start &&
                  booking.status === 'booked'
              )

              return (
                <div
                  key={slot.slot_start}
                  className="rounded-xl border border-white/[0.07] bg-[#202020]/60 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold">
                        {formatTime(slot.slot_start)} –{' '}
                        {formatTime(slot.slot_end)}
                      </p>

                      <p className="mt-1 flex items-center gap-1 text-xs text-white/40">
                        <Users size={13} />
                        {slot.booked_count} booked
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${getCrowdStyle(slot.crowd_level)}`}
                    >
                      {slot.crowd_level}
                    </span>
                  </div>

                  {slotBookings.length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-white/[0.07] pt-3">
                      {slotBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex flex-wrap items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {booking.profile?.full_name || 'Unknown member'}
                            </p>

                            <p className="mt-1 text-xs text-white/35">
                              {booking.profile?.phone || 'No phone number'}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={Boolean(actionLoading)}
                            onClick={() => handleCancelBooking(booking)}
                            className="flex items-center gap-1 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/10 disabled:opacity-40"
                          >
                            {actionLoading === booking.id ? (
                              <RefreshCw size={13} className="animate-spin" />
                            ) : (
                              <XCircle size={14} />
                            )}
                            Cancel
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Operating hours */}
      <section className="space-y-5 rounded-xl border border-white/[0.07] bg-[#181818] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <Settings2 className="text-[#FF8248]" size={20} />

          <div>
            <h2 className="text-lg font-bold">Operating hours</h2>
            <p className="mt-1 text-xs text-white/35">
              Configure your weekly schedule.
            </p>
          </div>
        </div>

        {settingsLoading ? (
          <p className="py-6 text-sm text-white/40">
            Loading operating hours...
          </p>
        ) : hours.length !== 7 ? (
          <p className="rounded-lg bg-red-500/10 p-4 text-sm text-red-300">
            Expected seven operating-hour records. Found {hours.length}.
          </p>
        ) : (
          <div className="space-y-3">
            {weekdays.map((day) => {
              const schedule = hours.find(
                (item) => item.weekday === day.weekday
              )

              if (!schedule) return null

              return (
                <div
                  key={day.weekday}
                  className="grid gap-3 rounded-xl border border-white/[0.06] bg-[#202020]/50 p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
                >
                  <div>
                    <p className="font-bold">{day.name}</p>
                    <p className="mt-1 text-xs text-white/30">
                      Weekly schedule
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>Opening</label>
                    <input
                      type="time"
                      step="3600"
                      disabled={schedule.is_closed}
                      value={schedule.open_time?.slice(0, 5) || ''}
                      onChange={(e) =>
                        updateHour(day.weekday, 'open_time', e.target.value)
                      }
                      className={`${inputClass} disabled:opacity-30`}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Closing</label>
                    <input
                      type="time"
                      step="3600"
                      disabled={schedule.is_closed}
                      value={schedule.close_time?.slice(0, 5) || ''}
                      onChange={(e) =>
                        updateHour(day.weekday, 'close_time', e.target.value)
                      }
                      className={`${inputClass} disabled:opacity-30`}
                    />
                  </div>

                  <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-white/50">
                    <input
                      type="checkbox"
                      checked={schedule.is_closed}
                      onChange={(e) =>
                        updateHour(day.weekday, 'is_closed', e.target.checked)
                      }
                      className="h-4 w-4 accent-[#FF6B24]"
                    />
                    Closed
                  </label>
                </div>
              )
            })}
          </div>
        )}

        <button
          type="button"
          disabled={savingHours || settingsLoading || hours.length !== 7}
          onClick={handleSaveHours}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] px-5 py-3 text-sm font-bold text-[#F2E8DC] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={17} />
          {savingHours ? 'Saving schedule...' : 'Save operating hours'}
        </button>
      </section>

      {/* Special closures */}
      <section className="space-y-5 rounded-xl border border-white/[0.07] bg-[#181818] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <CalendarX className="text-[#FF8248]" size={20} />

          <div>
            <h2 className="text-lg font-bold">Special closures</h2>
            <p className="mt-1 text-xs text-white/35">
              Manage holidays and exceptional closure dates.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleAddClosure}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div>
            <label className={labelClass}>Closure date</label>
            <input
              type="date"
              min={getToday()}
              value={closureDate}
              onChange={(e) => setClosureDate(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Reason (optional)</label>
            <input
              type="text"
              value={closureReason}
              onChange={(e) => setClosureReason(e.target.value)}
              placeholder="e.g. Public holiday"
              maxLength={120}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={savingClosure || settingsLoading}
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] px-5 py-3 text-sm font-bold text-[#F2E8DC] transition hover:brightness-110 disabled:opacity-50 sm:col-span-2"
          >
            <Plus size={17} />
            {savingClosure ? 'Adding closure...' : 'Add closure'}
          </button>
        </form>

        <div className="space-y-3 border-t border-white/[0.07] pt-5">
          <h3 className="text-sm font-bold text-white/70">
            Upcoming closures
          </h3>

          {settingsLoading ? (
            <p className="text-sm text-white/40">Loading closures...</p>
          ) : closures.length === 0 ? (
            <p className="rounded-lg bg-[#202020] p-4 text-sm text-white/35">
              No upcoming closures.
            </p>
          ) : (
            closures.map((closure) => (
              <div
                key={closure.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#202020]/70 p-4"
              >
                <div>
                  <p className="text-sm font-bold">
                    {formatDate(closure.closure_date)}
                  </p>

                  <p className="mt-1 text-xs text-white/40">
                    {closure.reason || 'No reason provided'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteClosure(closure.id)}
                  className="flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
