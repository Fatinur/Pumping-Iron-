import { useEffect, useMemo, useState } from 'react'
import {
  CreditCard,
  CalendarDays,
  Dumbbell,
  ArrowRight,
  Clock3,
  Activity,
  ChevronRight,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Ruler,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  CalendarCheck,
  UserRound,
  Scale,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const quickLinks = [
  {
    title: 'Membership',
    description: 'View your plan and payment history.',
    path: '/member/membership',
    icon: CreditCard,
  },
  {
    title: 'Book a Session',
    description: 'Choose a time for your next gym visit.',
    path: '/member/booking',
    icon: CalendarDays,
  },
  {
    title: 'Workout Planner',
    description: 'Build and manage your workout routine.',
    path: '/member/workouts',
    icon: Dumbbell,
  },
]

const activityLevels = [
  { value: '1.2', label: 'Sedentary', description: 'Little or no exercise' },
  { value: '1.375', label: 'Lightly active', description: 'Exercise 1–3 days/week' },
  { value: '1.55', label: 'Moderately active', description: 'Exercise 3–5 days/week' },
  { value: '1.725', label: 'Very active', description: 'Exercise 6–7 days/week' },
  { value: '1.9', label: 'Extremely active', description: 'Very hard training / physical job' },
]

function SectionHeading({ children, action, to }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="text-lg font-bold text-[#F2E8DC]">{children}</h2>

      {action && (
        <Link
          to={to}
          className="flex items-center gap-1 text-sm text-[#FFB347] transition-colors hover:text-[#FF8248]"
        >
          {action}
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  )
}

function getTodayString() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDate(date) {
  if (!date) return '—'

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(date) {
  if (!date) return ''

  return new Date(date).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatTime(time) {
  if (!time) return ''

  const [hours, minutes] = time.split(':')
  const date = new Date()
  date.setHours(Number(hours), Number(minutes), 0, 0)

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null

  const birth = new Date(`${dateOfBirth}T00:00:00`)
  const today = new Date()

  let age = today.getFullYear() - birth.getFullYear()
  const monthDifference = today.getMonth() - birth.getMonth()

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birth.getDate())
  ) {
    age--
  }

  return age > 0 ? age : null
}

function getMembershipStatus(membership) {
  if (!membership) return 'none'

  if (membership.status === 'active') {
    if (
      !membership.is_lifetime_snapshot &&
      membership.end_date &&
      membership.end_date < getTodayString()
    ) {
      return 'expired'
    }

    return 'active'
  }

  return membership.status
}

function getStatusLabel(status) {
  const labels = {
    active: 'Active',
    pending_payment: 'Payment pending',
    expired: 'Expired',
    renewed: 'Renewed',
    payment_rejected: 'Payment rejected',
    none: 'No membership',
  }

  return labels[status] || status
}

function getDaysRemaining(endDate) {
  if (!endDate) return null

  const today = new Date(`${getTodayString()}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)

  return Math.ceil((end - today) / (1000 * 60 * 60 * 24))
}

function getActivityDescription(eventType) {
  const descriptions = {
    requested: 'Membership requested',
    activated: 'Membership activated',
    renewed: 'Membership renewed',
    expired: 'Membership expired',
    payment_rejected: 'Membership payment rejected',
  }

  return descriptions[eventType] || 'Membership update'
}

function getActivityIcon(type) {
  if (type === 'booking') return CalendarCheck
  if (type === 'workout') return Dumbbell
  return CreditCard
}

function StatCard({ label, value, description, icon: Icon, link, status }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#181818] p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/45">{label}</span>
        <Icon size={19} className="text-[#FFB347]" />
      </div>

      <p className="mt-5 break-words text-xl font-bold text-[#F2E8DC]">
        {value}
      </p>

      <p className="mt-2 text-xs text-white/35">{description}</p>

      {link && (
        <Link
          to={link.path}
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#FFB347] hover:text-[#FF8248]"
        >
          {link.label} <ArrowRight size={15} />
        </Link>
      )}

      {status && (
        <span className="mt-4 inline-flex rounded-full border border-white/10 px-2.5 py-1 text-xs text-[#FFB347]">
          {status}
        </span>
      )}
    </div>
  )
}

function NutritionMacro({ label, amount, icon: Icon, color, percentage }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#202020] p-4">
      <div className="flex items-center gap-2">
        <Icon size={17} style={{ color }} />
        <span className="text-sm text-white/50">{label}</span>
      </div>

      <p className="mt-3 text-2xl font-black text-[#F2E8DC]">
        {amount}g
      </p>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>

      <p className="mt-2 text-xs text-white/35">
        {percentage}% of daily calories
      </p>
    </div>
  )
}

function ReadOnlyMeasurement({ label, value, unit, icon: Icon }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-[#202020] p-4">
      <div className="flex items-center gap-2 text-white/40">
        <Icon size={16} className="text-[#FFB347]" />
        <span className="text-xs">{label}</span>
      </div>

      <p className="mt-2 text-2xl font-bold text-[#F2E8DC]">
        {value ? `${value} ${unit}` : 'Not provided'}
      </p>

      <p className="mt-1 text-[11px] text-white/30">
        From your member profile
      </p>
    </div>
  )
}

export default function MemberOverview() {
  const { profile, user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState('')
  const [membership, setMembership] = useState(null)
  const [bookings, setBookings] = useState([])
  const [workoutPlans, setWorkoutPlans] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [memberProfile, setMemberProfile] = useState(profile || null)

  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('')
  const [activityLevel, setActivityLevel] = useState('')

  const [savedTargets, setSavedTargets] = useState(null)
  const [savingTargets, setSavingTargets] = useState(false)
  const [targetsMessage, setTargetsMessage] = useState('')
  const [targetsError, setTargetsError] = useState('')
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  const firstName =
    memberProfile?.full_name?.trim().split(' ')[0] || 'Member'

  // Load the member's saved nutrition settings.
  useEffect(() => {
    if (!user?.id) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettingsLoaded(false)

    try {
      const saved = localStorage.getItem(`pumping-iron-nutrition-${user.id}`)

      if (saved) {
        const parsed = JSON.parse(saved)

        setSavedTargets(parsed)
        setAge(parsed.age || '')
        setSex(parsed.sex || '')
        setActivityLevel(parsed.activityLevel || '')
      }
    } catch (error) {
      console.error('Could not load saved nutrition settings:', error)
    }

    setSettingsLoaded(true)
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      setDashboardError('')

      const today = getTodayString()

      const [
        profileResult,
        membershipResult,
        bookingResult,
        workoutResult,
        eventResult,
        recentBookingResult,
        workoutLogResult,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, date_of_birth, gender, height_cm, weight_kg')
          .eq('id', user.id)
          .maybeSingle(),

        supabase
          .from('memberships')
          .select(
            'id, user_id, plan_name_snapshot, duration_months_snapshot, is_lifetime_snapshot, amount_paid, start_date, end_date, status, created_at'
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('bookings')
          .select('id, booking_date, start_time, end_time, status, created_at, cancelled_at')
          .eq('user_id', user.id)
          .eq('status', 'booked')
          .gte('booking_date', today)
          .order('booking_date', { ascending: true })
          .order('start_time', { ascending: true }),

        supabase
          .from('workout_plans')
          .select('id, title, plan_type, structure_mode, created_at, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }),

        supabase
          .from('membership_events')
          .select('id, event_type, description, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(6),

        supabase
          .from('bookings')
          .select('id, booking_date, start_time, status, created_at, cancelled_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(6),

        supabase
          .from('workout_logs')
          .select('id, workout_date, notes, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(6),
      ])

      if (cancelled) return

      const errors = [
        profileResult.error,
        membershipResult.error,
        bookingResult.error,
        workoutResult.error,
        eventResult.error,
        recentBookingResult.error,
        workoutLogResult.error,
      ].filter(Boolean)

      if (errors.length) {
        console.error('Member dashboard loading errors:', errors)
        setDashboardError(
          'Some dashboard information could not be loaded. Please refresh the page.'
        )
      }

      if (profileResult.data) {
        const profileData = profileResult.data

        setMemberProfile(profileData)
        setHeight(profileData.height_cm ?? '')
        setWeight(profileData.weight_kg ?? '')

        // Use the profile age and gender only when no saved settings exist.
        const saved = localStorage.getItem(
          `pumping-iron-nutrition-${user.id}`
        )

        if (!saved) {
          const calculatedAge = calculateAge(profileData.date_of_birth)
          setAge(calculatedAge ? String(calculatedAge) : '')

          const gender = String(profileData.gender || '').toLowerCase()

          if (['male', 'man'].includes(gender)) setSex('male')
          else if (['female', 'woman'].includes(gender)) setSex('female')
        }
      }

      const memberships = membershipResult.data || []

      const activeMembership = memberships.find((item) => {
        if (item.status !== 'active') return false

        return (
          item.is_lifetime_snapshot ||
          !item.end_date ||
          item.end_date >= today
        )
      })

      const pendingMembership = memberships.find(
        (item) => item.status === 'pending_payment'
      )

      setMembership(
        activeMembership ||
          pendingMembership ||
          memberships[0] ||
          null
      )

      setBookings(bookingResult.data || [])
      setWorkoutPlans(workoutResult.data || [])

      const events = (eventResult.data || []).map((event) => ({
        id: `event-${event.id}`,
        type: 'membership',
        title: event.description || getActivityDescription(event.event_type),
        date: event.created_at,
      }))

      const bookingActivities = (recentBookingResult.data || []).map(
        (booking) => ({
          id: `booking-${booking.id}`,
          type: 'booking',
          title:
            booking.status === 'cancelled'
              ? 'Booking cancelled'
              : 'Gym session booked',
          date: booking.cancelled_at || booking.created_at,
          details: `${formatDate(booking.booking_date)} · ${formatTime(booking.start_time)}`,
        })
      )

      const workoutActivities = (workoutLogResult.data || []).map((log) => ({
        id: `workout-${log.id}`,
        type: 'workout',
        title: 'Workout logged',
        date: log.created_at,
        details: log.notes?.trim() || `Workout date: ${formatDate(log.workout_date)}`,
      }))

      setRecentActivity(
        [...events, ...bookingActivities, ...workoutActivities]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 6)
      )

      setLoading(false)
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const membershipStatus = getMembershipStatus(membership)

  const daysRemaining =
    membershipStatus === 'active' && membership?.end_date
      ? getDaysRemaining(membership.end_date)
      : null

  const nutrition = useMemo(() => {
    const heightValue = Number(height)
    const weightValue = Number(weight)
    const ageValue = Number(age)
    const activityMultiplier = Number(activityLevel)

    if (
      !heightValue ||
      !weightValue ||
      !ageValue ||
      !activityMultiplier ||
      !sex ||
      heightValue <= 0 ||
      weightValue <= 0 ||
      ageValue <= 0
    ) {
      return null
    }

    const bmr =
      10 * weightValue +
      6.25 * heightValue -
      5 * ageValue +
      (sex === 'male' ? 5 : -161)

    const calories = Math.round(bmr * activityMultiplier)

    const protein = Math.round(weightValue * 1.8)
    const fat = Math.round(weightValue * 0.8)

    const remainingCalories = calories - protein * 4 - fat * 9
    const carbs = Math.max(0, Math.round(remainingCalories / 4))

    const totalCalories = protein * 4 + fat * 9 + carbs * 4

    return {
      bmr: Math.round(bmr),
      calories,
      protein,
      fat,
      carbs,
      proteinPercentage: Math.round((protein * 4 / totalCalories) * 100),
      fatPercentage: Math.round((fat * 9 / totalCalories) * 100),
      carbsPercentage: Math.round((carbs * 4 / totalCalories) * 100),
    }
  }, [height, weight, age, sex, activityLevel])

  // Save the calculation settings in this browser for this member.
  function saveNutritionTargets() {
    setTargetsMessage('')
    setTargetsError('')

    if (!nutrition) {
      setTargetsError('Complete all calculation details first.')
      return
    }

    if (
      Number(age) < 15 ||
      Number(age) > 100 ||
      !activityLevel ||
      !sex
    ) {
      setTargetsError('Please check your age, sex and activity level.')
      return
    }

    setSavingTargets(true)

    try {
      const settings = {
        age,
        sex,
        activityLevel,
        savedAt: new Date().toISOString(),
      }

      localStorage.setItem(
        `pumping-iron-nutrition-${user.id}`,
        JSON.stringify(settings)
      )

      setSavedTargets(settings)
      setTargetsMessage('Your calorie and macro targets have been saved.')
    } catch (error) {
      console.error('Could not save nutrition settings:', error)
      setTargetsError('Could not save your targets in this browser.')
    }

    setSavingTargets(false)
  }

  const hasSavedTargets = Boolean(savedTargets)

  return (
    <div className="space-y-9">
      {/* Welcome */}
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF8248]">
            Member Dashboard
          </p>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-[#FFB347] to-[#D94A36] bg-clip-text text-transparent">
              {firstName}.
            </span>
          </h1>

          <p className="mt-3 text-sm text-white/45">
            Your progress starts with showing up. Let's get to work.
          </p>
        </div>

        <div className="rounded-lg border border-white/[0.07] bg-[#181818] px-4 py-3">
          <p className="text-xs text-white/35">Signed in as</p>
          <p className="mt-1 max-w-[220px] truncate text-sm font-medium text-[#F2E8DC]">
            {user?.email}
          </p>
        </div>
      </section>

      {dashboardError && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          <AlertCircle size={18} />
          {dashboardError}
        </div>
      )}

      {/* Overview cards */}
      <section>
        <SectionHeading>YOUR OVERVIEW</SectionHeading>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-xl border border-white/[0.07] bg-[#181818]"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Membership"
              value={membership ? membership.plan_name_snapshot : 'No membership yet'}
              description={
                membershipStatus === 'active'
                  ? membership?.is_lifetime_snapshot
                    ? 'Lifetime membership'
                    : daysRemaining >= 0
                      ? `${daysRemaining} days remaining · Ends ${formatDate(membership.end_date)}`
                      : `Ends ${formatDate(membership.end_date)}`
                  : membershipStatus === 'pending_payment'
                    ? 'Waiting for payment confirmation.'
                    : membershipStatus === 'expired'
                      ? `Expired ${formatDate(membership?.end_date)}`
                      : 'Choose a membership plan to get started.'
              }
              icon={CreditCard}
              link={{ path: '/member/membership', label: 'View membership' }}
              status={getStatusLabel(membershipStatus)}
            />

            <StatCard
              label="Next booking"
              value={
                bookings[0]
                  ? formatDate(bookings[0].booking_date)
                  : 'No upcoming session'
              }
              description={
                bookings[0]
                  ? `${formatTime(bookings[0].start_time)} – ${formatTime(bookings[0].end_time)}`
                  : 'Your upcoming gym sessions will appear here.'
              }
              icon={CalendarDays}
              link={{ path: '/member/booking', label: 'Manage bookings' }}
              status={
                bookings.length
                  ? `${bookings.length} upcoming booked session${bookings.length === 1 ? '' : 's'}`
                  : null
              }
            />

            <StatCard
              label="Workout plans"
              value={
                workoutPlans.length
                  ? `${workoutPlans.length} plan${workoutPlans.length === 1 ? '' : 's'}`
                  : 'No workout plans'
              }
              description={
                workoutPlans[0]
                  ? `Latest: ${workoutPlans[0].title}`
                  : 'Create or receive a workout routine.'
              }
              icon={Dumbbell}
              link={{ path: '/member/workouts', label: 'Open workout planner' }}
              status={
                workoutPlans.length
                  ? `${workoutPlans.filter((plan) => plan.plan_type === 'assigned').length} assigned · ${workoutPlans.filter((plan) => plan.plan_type === 'personal').length} personal`
                  : null
              }
            />
          </div>
        )}
      </section>

      {/* Nutrition tracker */}
      <section>
        <SectionHeading>CALORIE & MACRO TRACKER</SectionHeading>

        <div className="overflow-hidden rounded-xl border border-[#FF6B24]/15 bg-[#181818]">
          <div className="border-b border-white/[0.07] bg-gradient-to-r from-[#251A15] to-[#181818] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#FF6B24]/10 p-3 text-[#FFB347]">
                <Flame size={23} />
              </div>

              <div>
                <h3 className="font-bold text-[#F2E8DC]">
                  Your daily maintenance target
                </h3>
                <p className="mt-1 text-xs text-white/40">
                  Estimated calories and macronutrient requirements.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Estimated maintenance calories
              </p>

              <div className="mt-2 flex items-end gap-2">
                <span className="text-4xl font-black tracking-tight text-[#F2E8DC] sm:text-5xl">
                  {nutrition ? nutrition.calories.toLocaleString() : '—'}
                </span>
                <span className="mb-1 text-sm text-white/40">kcal / day</span>
              </div>

              {nutrition && (
                <p className="mt-2 text-xs text-white/35">
                  Estimated BMR: {nutrition.bmr.toLocaleString()} kcal/day
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            {/* Read-only profile measurements */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Ruler size={17} className="text-[#FFB347]" />
                <h4 className="font-bold text-[#F2E8DC]">
                  Your measurements
                </h4>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <ReadOnlyMeasurement
                  label="Height"
                  value={height}
                  unit="cm"
                  icon={Ruler}
                />

                <ReadOnlyMeasurement
                  label="Weight"
                  value={weight}
                  unit="kg"
                  icon={Scale}
                />
              </div>

              <p className="mt-3 text-xs text-white/30">
                These values are taken from your member profile. Contact the gym owner if they need to be corrected.
              </p>
            </div>

            <div className="h-px bg-white/[0.07]" />

            {/* Calculation inputs */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <UserRound size={17} className="text-[#FFB347]" />
                <h4 className="font-bold text-[#F2E8DC]">
                  Calculation details
                </h4>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs text-white/45">
                    Age (years)
                  </span>
                  <input
                    type="number"
                    min="15"
                    max="100"
                    value={age}
                    onChange={(event) => setAge(event.target.value)}
                    placeholder="Your age"
                    className="w-full rounded-lg border border-white/10 bg-[#202020] px-4 py-3 text-sm text-[#F2E8DC] outline-none transition focus:border-[#FF6B24]/60"
                  />
                  <span className="mt-1 block text-[11px] text-white/30">
                    Automatically filled from your date of birth.
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs text-white/45">
                    Sex for calorie equation
                  </span>
                  <select
                    value={sex}
                    onChange={(event) => setSex(event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#202020] px-4 py-3 text-sm text-[#F2E8DC] outline-none focus:border-[#FF6B24]/60"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <span className="mt-1 block text-[11px] text-white/30">
                    Used only for the Mifflin-St Jeor estimate.
                  </span>
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs text-white/45">
                    Activity level
                  </span>
                  <select
                    value={activityLevel}
                    onChange={(event) => setActivityLevel(event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#202020] px-4 py-3 text-sm text-[#F2E8DC] outline-none focus:border-[#FF6B24]/60"
                  >
                    <option value="">Choose your activity level</option>
                    {activityLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label} — {level.description}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="button"
                onClick={saveNutritionTargets}
                disabled={savingTargets || !settingsLoaded}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#FF8248] to-[#D94A36] px-5 py-3 text-sm font-bold text-[#F2E8DC] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingTargets ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {savingTargets ? 'Saving...' : 'Save calorie & macro targets'}
              </button>

              {targetsMessage && (
                <p className="mt-3 flex items-center gap-2 text-xs text-green-400">
                  <CheckCircle2 size={15} />
                  {targetsMessage}
                </p>
              )}

              {targetsError && (
                <p className="mt-3 flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle size={15} />
                  {targetsError}
                </p>
              )}

              {hasSavedTargets && (
                <p className="mt-3 text-[11px] text-white/30">
                  Your calculation settings are saved on this browser.
                </p>
              )}
            </div>

            <div className="h-px bg-white/[0.07]" />

            {/* Macro results */}
            <div>
              <div className="mb-4">
                <h4 className="font-bold text-[#F2E8DC]">
                  Your daily macro targets
                </h4>
                <p className="mt-1 text-xs text-white/40">
                  Estimated daily amounts based on your weight and calorie target.
                </p>
              </div>

              {nutrition ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <NutritionMacro
                    label="Protein"
                    amount={nutrition.protein}
                    icon={Beef}
                    color="#75D99A"
                    percentage={nutrition.proteinPercentage}
                  />

                  <NutritionMacro
                    label="Carbs"
                    amount={nutrition.carbs}
                    icon={Wheat}
                    color="#FFC66D"
                    percentage={nutrition.carbsPercentage}
                  />

                  <NutritionMacro
                    label="Fat"
                    amount={nutrition.fat}
                    icon={Droplets}
                    color="#D8A1E8"
                    percentage={nutrition.fatPercentage}
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-white/10 bg-[#202020]/50 px-5 py-8 text-center">
                  <Flame size={25} className="mx-auto text-[#FFB347]" />
                  <p className="mt-3 font-bold text-[#F2E8DC]">
                    Complete your details to calculate your targets
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-white/40">
                    Your height and weight come from your profile. Complete your age, sex and activity level to calculate your targets.
                  </p>
                </div>
              )}
            </div>

            <p className="text-[11px] leading-relaxed text-white/30">
              These are estimates for general fitness planning, not medical
              advice. Actual energy needs vary between individuals. Reassess
              your targets as your weight, activity and goals change.
            </p>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <SectionHeading>QUICK ACTIONS</SectionHeading>

        <div className="grid gap-4 md:grid-cols-3">
          {quickLinks.map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.title}
                to={item.path}
                className="group flex items-start gap-4 rounded-xl border border-white/[0.07] bg-[#181818] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FF6B24]/30 hover:bg-[#1C1C1C]"
              >
                <div className="rounded-lg bg-[#FF6B24]/10 p-3 text-[#FFB347]">
                  <Icon size={21} strokeWidth={1.8} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-[#F2E8DC]">{item.title}</h3>

                  <p className="mt-2 text-sm leading-relaxed text-white/40">
                    {item.description}
                  </p>

                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[#FFB347]">
                    Open <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Recent activity */}
      <section>
        <SectionHeading>RECENT ACTIVITY</SectionHeading>

        {loading ? (
          <div className="h-40 animate-pulse rounded-xl border border-white/[0.07] bg-[#181818]" />
        ) : recentActivity.length ? (
          <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.07] bg-[#181818]">
            {recentActivity.map((item) => {
              const Icon = getActivityIcon(item.type)

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 sm:p-5"
                >
                  <div className="rounded-lg bg-[#FF6B24]/10 p-3 text-[#FFB347]">
                    <Icon size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#F2E8DC]">
                      {item.title}
                    </p>
                    {item.details && (
                      <p className="mt-1 text-xs text-white/40">
                        {item.details}
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 text-right text-[11px] text-white/35">
                    {formatDateTime(item.date)}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.07] bg-[#181818] px-6 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#303030]">
              <Activity size={22} className="text-[#FFB347]" />
            </div>

            <h3 className="mt-4 font-bold text-[#F2E8DC]">
              Your journey starts here
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/40">
              Your membership and booking activity will appear here as you
              use the gym.
            </p>
          </div>
        )}
      </section>

      {/* Motivation */}
      <section className="relative overflow-hidden rounded-xl border border-[#FF6B24]/15 bg-gradient-to-br from-[#251A15] to-[#181818] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[#FF6B24]/[0.07] blur-3xl" />

        <div className="relative">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#FFB347]">
            <Clock3 size={15} />
            The only bad workout is the one you skipped
          </div>

          <h2 className="max-w-xl text-2xl font-black leading-tight sm:text-3xl">
            NO EXCUSES.
            <br />
            JUST PROGRESS.
          </h2>

          <p className="mt-3 text-sm text-white/45">
            Stay consistent. Trust the process. Get stronger.
          </p>
        </div>
      </section>
    </div>
  )
}