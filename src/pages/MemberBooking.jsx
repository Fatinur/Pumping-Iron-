
import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Dumbbell,
  AlertCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function toDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDate(dateString, options = {}) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    'en-BD',
    options,
  )
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

export default function MemberBooking() {
  const { user } = useAuth()

  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()))
  const [slots, setSlots] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [operatingHours, setOperatingHours] = useState(null)
  const [closure, setClosure] = useState(null)

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const availableDates = Array.from({ length: 31 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)

    return {
      value: toDateString(date),
      date,
    }
  })

  useEffect(() => {
    let mounted = true

    async function loadSchedule() {
      if (!user?.id) return

      setLoading(true)
      setError('')
      setSuccess('')

      const dateObject = new Date(`${selectedDate}T00:00:00`)
      const jsWeekday = dateObject.getDay()
      const weekday = jsWeekday === 0 ? 7 : jsWeekday

      const [
        hoursResult,
        closureResult,
        crowdsResult,
        bookingsResult,
      ] = await Promise.all([
        supabase
          .from('gym_operating_hours')
          .select('*')
          .eq('weekday', weekday)
          .maybeSingle(),

        supabase
          .from('gym_closures')
          .select('*')
          .eq('closure_date', selectedDate)
          .maybeSingle(),

        supabase.rpc('get_slot_crowds', {
          p_booking_date: selectedDate,
        }),

        supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id)
          .eq('booking_date', selectedDate)
          .eq('status', 'booked')
          .order('start_time', { ascending: true }),
      ])

      if (!mounted) return

      const failedResult = [
        hoursResult,
        closureResult,
        crowdsResult,
        bookingsResult,
      ].find((result) => result.error)

      if (failedResult) {
        setError(failedResult.error.message)
        setLoading(false)
        return
      }

      setOperatingHours(hoursResult.data)
      setClosure(closureResult.data)
      setSlots(crowdsResult.data || [])
      setMyBookings(bookingsResult.data || [])
      setLoading(false)
    }

    loadSchedule()

    return () => {
      mounted = false
    }
  }, [selectedDate, user?.id, refreshKey])

  const myBooking = myBookings[0]

  async function handleBookSlot(slot) {
    const startTime = slot.slot_start

    setActionLoading(startTime)
    setError('')
    setSuccess('')

    const { error: bookingError } = await supabase.rpc(
      'book_gym_slot',
      {
        p_booking_date: selectedDate,
        p_start_time: startTime,
      },
    )

    if (bookingError) {
      setError(bookingError.message)
      setActionLoading('')
      return
    }

    setSuccess('Your gym session has been booked successfully.')
    setActionLoading('')
    setRefreshKey((current) => current + 1)
  }

  async function handleCancelBooking(bookingId) {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this booking?',
    )

    if (!confirmed) return

    setActionLoading(bookingId)
    setError('')
    setSuccess('')

    const { error: cancelError } = await supabase.rpc(
      'cancel_gym_booking',
      {
        p_booking_id: bookingId,
      },
    )

    if (cancelError) {
      setError(cancelError.message)
      setActionLoading('')
      return
    }

    setSuccess('Your booking has been cancelled.')
    setActionLoading('')
    setRefreshKey((current) => current + 1)
  }

  const gymClosed = operatingHours?.is_closed || closure

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#FF6B24]">
          Plan your training
        </p>

        <h1 className="text-3xl font-black text-[#F2E8DC] sm:text-4xl">
          Gym Booking
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#F2E8DC]/50">
          Choose a date, check expected crowd levels and reserve your
          preferred training time.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          {success}
        </div>
      )}

      {/* Date selector */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays size={19} className="text-[#FF6B24]" />
          <h2 className="font-bold text-[#F2E8DC]">Choose a date</h2>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-3">
          {availableDates.map(({ value, date }) => {
            const selected = selectedDate === value
            const isToday = value === toDateString(today)

            return (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedDate(value)}
                className={`flex min-w-[76px] flex-col items-center rounded-xl border px-4 py-4 transition ${
                  selected
                    ? 'border-[#FF6B24] bg-[#FF6B24]/10'
                    : 'border-white/10 bg-[#1C1C1C] hover:border-white/25'
                }`}
              >
                <span className="text-xs text-[#F2E8DC]/40">
                  {isToday
                    ? 'Today'
                    : date.toLocaleDateString('en-BD', {
                        weekday: 'short',
                      })}
                </span>

                <span
                  className={`mt-2 text-xl font-black ${
                    selected ? 'text-[#FF6B24]' : 'text-[#F2E8DC]'
                  }`}
                >
                  {date.getDate()}
                </span>

                <span className="mt-1 text-xs text-[#F2E8DC]/40">
                  {date.toLocaleDateString('en-BD', {
                    month: 'short',
                  })}
                </span>
              </button>
            )
          })}
        </div>

        <p className="mt-2 text-xs text-[#F2E8DC]/35">
          Selected: {formatDate(selectedDate, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </section>

      {/* Selected date details */}
      <section className="rounded-2xl border border-white/10 bg-[#1C1C1C] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#F2E8DC]/35">
              Gym schedule
            </p>

            <h2 className="mt-2 text-xl font-black text-[#F2E8DC]">
              {formatDate(selectedDate, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h2>
          </div>

          {operatingHours && !operatingHours.is_closed && (
            <div className="rounded-xl bg-[#303030] px-4 py-3">
              <p className="text-xs text-[#F2E8DC]/40">
                Opening hours
              </p>

              <p className="mt-1 font-bold text-[#F2E8DC]">
                {formatTime(operatingHours.open_time)} –{' '}
                {formatTime(operatingHours.close_time)}
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center text-sm text-[#F2E8DC]/50">
            <RefreshCw className="mr-3 animate-spin" size={18} />
            Loading schedule...
          </div>
        ) : gymClosed ? (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
            <XCircle className="mx-auto mb-3 text-red-400" size={28} />

            <h3 className="font-bold text-[#F2E8DC]">
              Gym closed on this date
            </h3>

            <p className="mt-2 text-sm text-[#F2E8DC]/45">
              {closure?.reason || 'The gym is not operating on this day.'}
            </p>
          </div>
        ) : !operatingHours ? (
          <div className="mt-6 rounded-xl bg-[#303030] p-5 text-center text-sm text-[#F2E8DC]/50">
            Operating hours have not been configured for this day.
          </div>
        ) : (
          <>
            {/* Crowd legend */}
            <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-5">
              <span className="text-xs text-[#F2E8DC]/40">
                Expected crowd:
              </span>

              <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
                Low: 0–4
              </span>

              <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-400">
                Moderate: 5–9
              </span>

              <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
                Busy: 10+
              </span>
            </div>

            {myBooking && (
              <div className="mt-5 rounded-xl border border-[#FF6B24]/20 bg-[#FF6B24]/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#FF6B24]">
                      Your booking
                    </p>

                    <p className="mt-1 font-bold text-[#F2E8DC]">
                      {formatTime(myBooking.start_time)} –{' '}
                      {formatTime(myBooking.end_time)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCancelBooking(myBooking.id)}
                    disabled={Boolean(actionLoading)}
                    className="rounded-lg border border-red-500/30 px-4 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/10 disabled:opacity-40"
                  >
                    {actionLoading === myBooking.id
                      ? 'Cancelling...'
                      : 'Cancel booking'}
                  </button>
                </div>
              </div>
            )}

            {/* Slots */}
            <div className="mt-6 space-y-3">
              {slots.length === 0 ? (
                <div className="rounded-xl bg-[#303030]/60 p-6 text-center">
                  <Clock
                    className="mx-auto mb-3 text-[#F2E8DC]/30"
                    size={26}
                  />

                  <p className="font-bold text-[#F2E8DC]">
                    No booking slots available
                  </p>

                  <p className="mt-2 text-sm text-[#F2E8DC]/40">
                    There are no hourly slots available for this date.
                  </p>
                </div>
              ) : (
                slots.map((slot) => {
                  const bookedByMe = myBookings.some(
                    (booking) =>
                      booking.start_time === slot.slot_start,
                  )

                  const disabled =
                    Boolean(myBooking) ||
                    Boolean(actionLoading) ||
                    bookedByMe

                  return (
                    <div
                      key={slot.slot_start}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#303030]/40 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF6B24]/10 text-[#FF6B24]">
                          <Clock size={18} />
                        </div>

                        <div>
                          <p className="font-bold text-[#F2E8DC]">
                            {formatTime(slot.slot_start)} –{' '}
                            {formatTime(slot.slot_end)}
                          </p>

                          <div className="mt-1 flex items-center gap-1 text-xs text-[#F2E8DC]/40">
                            <Users size={13} />
                            {slot.booked_count} booked
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getCrowdStyle(slot.crowd_level)}`}
                        >
                          {slot.crowd_level}
                        </span>

                        {bookedByMe ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-green-400">
                            <CheckCircle2 size={15} />
                            Your booking
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => handleBookSlot(slot)}
                            className="rounded-lg bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] px-4 py-2.5 text-xs font-bold text-[#F2E8DC] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {actionLoading === slot.slot_start
                              ? 'Booking...'
                              : myBooking
                                ? 'One booking per day'
                                : 'Book slot'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
      </section>

      {/* Information */}
      <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#1C1C1C] p-5">
        <Dumbbell className="mt-0.5 shrink-0 text-[#FF6B24]" size={19} />

        <div>
          <p className="font-bold text-[#F2E8DC]">
            A few things to remember
          </p>

          <ul className="mt-2 space-y-1 text-sm leading-6 text-[#F2E8DC]/45">
            <li>• You can make one booking per day.</li>
            <li>• You can cancel your booking and choose another slot.</li>
            <li>• Crowd levels are based on bookings, not actual attendance.</li>
            <li>• You can book up to 30 days in advance.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
