
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  UserRound,
  Phone,
  CalendarDays,
  Ruler,
  Weight,
  CreditCard,
  Dumbbell,
 
  RefreshCw,
  AlertCircle,
  Activity,
  ClipboardList,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

function formatDate(date) {
  if (!date) return '—'

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(date) {
  if (!date) return '—'

  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatAmount(amount) {
  return `৳${Number(amount || 0).toLocaleString('en-BD')}`
}

function getMembershipStatus(membership) {
  if (membership.is_lifetime_snapshot) return 'Lifetime'

  if (membership.status === 'pending_payment') return 'Pending Payment'
  if (membership.status === 'cancelled') return 'Cancelled'

  if (membership.end_date) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const endDate = new Date(`${membership.end_date}T00:00:00`)

    if (endDate < today) return 'Expired'
  }

  if (membership.status === 'active') return 'Active'
  if (membership.status === 'renewed') return 'Renewed'

  return membership.status?.replaceAll('_', ' ') || 'Unknown'
}

function statusStyle(status) {
  const styles = {
    Active: 'bg-green-500/10 text-green-400',
    Lifetime: 'bg-purple-500/10 text-purple-400',
    Expired: 'bg-red-500/10 text-red-400',
    Renewed: 'bg-blue-500/10 text-blue-400',
    'Pending Payment': 'bg-yellow-500/10 text-yellow-400',
    Cancelled: 'bg-white/[0.06] text-white/40',
  }

  return styles[status] || 'bg-white/[0.06] text-white/50'
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#1B1B1B] p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF6B24]/10 text-[#FFB347]">
        <Icon size={19} />
      </div>

      <p className="text-xs text-white/40">{label}</p>
      <p className="mt-1 break-words text-lg font-semibold text-[#F2E8DC]">
        {value || '—'}
      </p>
    </div>
  )
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FF6B24]/10 text-[#FFB347]">
        <Icon size={19} />
      </div>

      <div>
        <h2 className="text-lg font-bold text-[#F2E8DC]">{title}</h2>
        <p className="text-xs text-white/35">{description}</p>
      </div>
    </div>
  )
}

export default function AdminMemberDetails() {
  const { memberId } = useParams()
  const navigate = useNavigate()

  const [member, setMember] = useState(null)
  const [memberships, setMemberships] = useState([])
  const [workoutPlans, setWorkoutPlans] = useState([])
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchMemberDetails() {
      setLoading(true)
      setError('')

      try {
        const [
          profileResult,
          membershipResult,
          workoutResult,
        ] = await Promise.all([
          supabase
            .from('profiles')
            .select(
              'id, full_name, phone, date_of_birth, gender, height_cm, weight_kg, created_at'
            )
            .eq('id', memberId)
            .eq('role', 'member')
            .maybeSingle(),

          supabase
            .from('memberships')
            .select(
              'id, plan_name_snapshot, duration_months_snapshot, is_lifetime_snapshot, amount_paid, start_date, end_date, status, created_at'
            )
            .eq('user_id', memberId)
            .order('created_at', { ascending: false }),

          supabase
            .from('workout_plans')
            .select('id, title, plan_type, structure_mode, created_at')
            .eq('user_id', memberId)
            .order('created_at', { ascending: false }),
        ])

        if (profileResult.error) throw profileResult.error
        if (membershipResult.error) throw membershipResult.error
        if (workoutResult.error) throw workoutResult.error

        if (!profileResult.data) {
          throw new Error('Member not found.')
        }

        const plans = workoutResult.data || []
        const planIds = plans.map((plan) => plan.id)

        let exerciseData = []

        if (planIds.length > 0) {
          const exerciseResult = await supabase
            .from('plan_exercises')
            .select(
              'id, plan_id, exercise_name, day_name, instructions, sort_order'
            )
            .in('plan_id', planIds)
            .order('sort_order', { ascending: true })

          if (exerciseResult.error) throw exerciseResult.error

          exerciseData = exerciseResult.data || []
        }

        if (!isMounted) return

        setMember(profileResult.data)
        setMemberships(membershipResult.data || [])
        setWorkoutPlans(plans)
        setExercises(exerciseData)
      } catch (err) {
        console.error('Failed to load member details:', err)

        if (isMounted) {
          setError(err.message || 'Failed to load member details.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (memberId) fetchMemberDetails()

    return () => {
      isMounted = false
    }
  }, [memberId])

  const latestActiveMembership = memberships.find((membership) => {
    return getMembershipStatus(membership) === 'Active' ||
      getMembershipStatus(membership) === 'Lifetime'
  })

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <RefreshCw className="animate-spin text-[#FFB347]" size={28} />
      </div>
    )
  }

  if (error || !member) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-6">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle size={20} />
          <p className="font-semibold">
            {error || 'Member could not be found.'}
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/members')}
          className="mt-5 flex items-center gap-2 text-sm font-bold text-[#FFB347] hover:text-[#FF6B24]"
        >
          <ArrowLeft size={16} />
          Back to Members
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/admin/members')}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-white/45 transition-colors hover:text-[#FFB347]"
        >
          <ArrowLeft size={17} />
          Back to Members
        </button>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#FF6B24]/10 text-2xl font-bold text-[#FFB347]">
              {member.full_name?.charAt(0)?.toUpperCase() || 'M'}
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#FFB347]">
                Member Profile
              </p>
              <h1 className="text-2xl font-bold text-[#F2E8DC] sm:text-3xl">
                {member.full_name || 'Unnamed Member'}
              </h1>
              <p className="mt-1 text-sm text-white/40">
                Registered {formatDateTime(member.created_at)}
              </p>
            </div>
          </div>

          {latestActiveMembership ? (
            <span className="w-fit rounded-full bg-green-500/10 px-4 py-2 text-xs font-semibold text-green-400">
              Active Member
            </span>
          ) : (
            <span className="w-fit rounded-full bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white/45">
              No Active Membership
            </span>
          )}
        </div>
      </div>

      {/* Overview */}
      <section>
        <SectionHeading
          icon={UserRound}
          title="Member Overview"
          description="Personal information and account details"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <InfoCard
            icon={UserRound}
            label="Full Name"
            value={member.full_name}
          />

          <InfoCard
            icon={Phone}
            label="Phone Number"
            value={member.phone}
          />

          <InfoCard
            icon={CalendarDays}
            label="Date of Birth"
            value={formatDate(member.date_of_birth)}
          />

          <InfoCard
            icon={UserRound}
            label="Gender"
            value={member.gender}
          />

          <InfoCard
            icon={CalendarDays}
            label="Registration Date"
            value={formatDateTime(member.created_at)}
          />
        </div>
      </section>

      {/* Membership History */}
      <section>
        <SectionHeading
          icon={CreditCard}
          title="Membership History"
          description="Current and previous membership records"
        />

        {memberships.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] bg-[#1B1B1B] px-5 py-10 text-center">
            <CreditCard className="mx-auto mb-3 text-white/20" size={30} />
            <p className="font-semibold text-white/60">
              No membership records
            </p>
            <p className="mt-1 text-sm text-white/30">
              This member has no recorded memberships yet.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#1B1B1B]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left">
                <thead className="border-b border-white/[0.07] bg-white/[0.02]">
                  <tr className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                    <th className="px-5 py-4">Membership</th>
                    <th className="px-5 py-4">Duration</th>
                    <th className="px-5 py-4">Amount Paid</th>
                    <th className="px-5 py-4">Start Date</th>
                    <th className="px-5 py-4">End Date</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.05]">
                  {memberships.map((membership) => {
                    const status = getMembershipStatus(membership)

                    return (
                      <tr key={membership.id}>
                        <td className="px-5 py-4 text-sm font-semibold text-[#F2E8DC]">
                          {membership.plan_name_snapshot}
                        </td>

                        <td className="px-5 py-4 text-sm text-white/50">
                          {membership.is_lifetime_snapshot
                            ? 'Lifetime'
                            : `${membership.duration_months_snapshot || '—'} months`}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-[#FFB347]">
                          {formatAmount(membership.amount_paid)}
                        </td>

                        <td className="px-5 py-4 text-sm text-white/50">
                          {formatDate(membership.start_date)}
                        </td>

                        <td className="px-5 py-4 text-sm text-white/50">
                          {membership.is_lifetime_snapshot
                            ? 'Lifetime'
                            : formatDate(membership.end_date)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1.5 text-[10px] font-semibold capitalize ${statusStyle(status)}`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Workout Plans */}
      <section>
        <SectionHeading
          icon={Dumbbell}
          title="Workout Plans"
          description="Workout plans and their assigned exercises"
        />

        {workoutPlans.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] bg-[#1B1B1B] px-5 py-10 text-center">
            <Dumbbell className="mx-auto mb-3 text-white/20" size={30} />
            <p className="font-semibold text-white/60">
              No workout plans
            </p>
            <p className="mt-1 text-sm text-white/30">
              No workout plans have been created for this member.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {workoutPlans.map((plan) => {
              const planExercises = exercises.filter(
                (exercise) => exercise.plan_id === plan.id
              )

              const groupedExercises = planExercises.reduce((groups, exercise) => {
                const day = exercise.day_name || 'General Exercises'

                if (!groups[day]) groups[day] = []
                groups[day].push(exercise)

                return groups
              }, {})

              return (
                <div
                  key={plan.id}
                  className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#1B1B1B]"
                >
                  <div className="flex flex-col gap-3 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-bold text-[#F2E8DC]">
                        {plan.title}
                      </h3>

                      <p className="mt-1 text-xs text-white/35">
                        Created {formatDateTime(plan.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#FF6B24]/10 px-3 py-1.5 text-[10px] font-semibold capitalize text-[#FFB347]">
                        {plan.plan_type === 'personal'
                          ? 'Personal'
                          : 'Trainer Assigned'}
                      </span>

                      <span className="rounded-full bg-white/[0.05] px-3 py-1.5 text-[10px] font-semibold text-white/45">
                        {plan.structure_mode === 'by_day'
                          ? 'By Day'
                          : 'Custom Structure'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    {planExercises.length === 0 ? (
                      <p className="text-sm text-white/35">
                        No exercises added to this plan.
                      </p>
                    ) : (
                      <div className="space-y-5">
                        {Object.entries(groupedExercises).map(
                          ([day, dayExercises]) => (
                            <div key={day}>
                              <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FFB347]">
                                <Activity size={15} />
                                {day}
                              </h4>

                              <div className="space-y-2">
                                {dayExercises.map((exercise, index) => (
                                  <div
                                    key={exercise.id}
                                    className="rounded-lg bg-[#222222] p-4"
                                  >
                                    <div className="flex items-start gap-3">
                                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[0.05] text-xs font-semibold text-white/50">
                                        {index + 1}
                                      </span>

                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold text-[#F2E8DC]">
                                          {exercise.exercise_name}
                                        </p>

                                        {exercise.instructions && (
                                          <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-white/40">
                                            {exercise.instructions}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Body Stats */}
      <section>
        <SectionHeading
          icon={ClipboardList}
          title="Body Stats"
          description="Current measurements saved in the member profile"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoCard
            icon={Ruler}
            label="Height"
            value={member.height_cm ? `${member.height_cm} cm` : 'Not provided'}
          />

          <InfoCard
            icon={Weight}
            label="Weight"
            value={member.weight_kg ? `${member.weight_kg} kg` : 'Not provided'}
          />
        </div>

        <p className="mt-3 text-xs text-white/30">
          These are the member's current profile measurements, not historical records.
        </p>
      </section>
    </div>
  )
}
