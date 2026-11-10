
import { useCallback, useEffect, useState } from 'react'
import {
  Check,
  Clock,
  CreditCard,
  Dumbbell,
  History,
  MessageCircle,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const currency = (amount) =>
  new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))

// Always use Bangladesh local date for membership calculations.
const getDhakaToday = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  )

  return `${values.year}-${values.month}-${values.day}`
}

const formatDate = (date) => {
  if (!date) return '—'

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Dhaka',
  })
}

const daysUntil = (date) => {
  if (!date) return 0

  const today = getDhakaToday()

  const [year, month, day] = today.split('-').map(Number)
  const [endYear, endMonth, endDay] = date.split('-').map(Number)

  const todayUTC = Date.UTC(year, month - 1, day)
  const endUTC = Date.UTC(endYear, endMonth - 1, endDay)

  return Math.round((endUTC - todayUTC) / 86400000)
}

const expiresInLabel = (date) => {
  if (!date) return '—'

  const days = daysUntil(date)

  if (days < 0) return 'Expired'
  if (days === 0) return 'Today'
  if (days === 1) return 'In 1 day'

  return `In ${days} days`
}

const durationLabel = (plan) => {
  if (plan.is_lifetime) return 'Lifetime access'

  const months = plan.duration_months
  return `${months} ${months === 1 ? 'month' : 'months'}`
}

const getBenefits = (benefits) => {
  if (Array.isArray(benefits)) return benefits

  if (benefits && typeof benefits === 'object') {
    return Object.values(benefits).flat()
  }

  return []
}

// Determine the actual membership position using its dates.
// Database status alone is not enough because early renewals
// can have status "active" while their start date is in the future.
const getMembershipPosition = (membership) => {
  const today = getDhakaToday()

  if (
    membership.status === 'pending_payment' ||
    membership.status === 'payment_rejected'
  ) {
    return membership.status
  }

  if (membership.status === 'expired') {
    return 'expired'
  }

  if (membership.status === 'renewed') {
    if (
      membership.start_date &&
      membership.start_date <= today &&
      (membership.is_lifetime_snapshot ||
        !membership.end_date ||
        membership.end_date >= today)
    ) {
      return 'renewed'
    }

    return 'renewed'
  }

  if (membership.status === 'active') {
    if (membership.start_date && membership.start_date > today) {
      return 'upcoming'
    }

    if (
      !membership.is_lifetime_snapshot &&
      membership.end_date &&
      membership.end_date < today
    ) {
      return 'expired'
    }

    return 'active'
  }

  return membership.status
}

const statusStyle = (status) => {
  switch (status) {
    case 'active':
    case 'renewed':
    case 'confirmed':
      return 'bg-green-500/10 text-green-400'

    case 'upcoming':
      return 'bg-blue-500/10 text-blue-400'

    case 'pending_payment':
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-400'

    case 'expired':
    case 'payment_rejected':
    case 'rejected':
      return 'bg-red-500/10 text-red-400'

    default:
      return 'bg-white/10 text-white/60'
  }
}

const statusLabel = (status) => {
  const labels = {
    active: 'Active',
    upcoming: 'Upcoming',
    pending_payment: 'Payment pending',
    pending: 'Pending',
    confirmed: 'Confirmed',
    expired: 'Expired',
    renewed: 'Renewed',
    payment_rejected: 'Payment rejected',
    rejected: 'Rejected',
  }

  return labels[status] || status
}

export default function MemberMembership() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [plans, setPlans] = useState([])
  const [memberships, setMemberships] = useState([])
  const [payments, setPayments] = useState([])
  const [settings, setSettings] = useState(null)

  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bkash')
  const [transactionId, setTransactionId] = useState('')

  // Update expired memberships before retrieving the latest records.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const loadData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError('')

    const { error: expiryError } = await supabase.rpc(
      'update_expired_memberships',
    )

    if (expiryError) {
      setError(
        `Could not update membership expiry: ${expiryError.message}`,
      )
      setLoading(false)
      return
    }

    const [
      plansResult,
      membershipsResult,
      paymentsResult,
      settingsResult,
    ] = await Promise.all([
      supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('duration_months', { ascending: true }),

      supabase
        .from('memberships')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      supabase
        .from('gym_settings')
        .select('gym_name, phone, whatsapp')
        .eq('id', true)
        .maybeSingle(),
    ])

    const failedResult = [
      plansResult,
      membershipsResult,
      paymentsResult,
      settingsResult,
    ].find((result) => result.error)

    if (failedResult) {
      setError(failedResult.error.message)
      setLoading(false)
      return
    }

    const planData = plansResult.data || []

    setPlans(planData)
    setMemberships(membershipsResult.data || [])
    setPayments(paymentsResult.data || [])
    setSettings(settingsResult.data)

    setSelectedPlanId((current) => {
      if (current && planData.some((plan) => plan.id === current)) {
        return current
      }

      return planData[0]?.id || ''
    })

    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  // A renewed membership can still cover today.
  // Do not rely only on status === "active".
  const activeMembership = memberships.find((membership) => {
    const position = getMembershipPosition(membership)

    return (
      (position === 'active' || position === 'renewed') &&
      membership.start_date &&
      membership.start_date <= getDhakaToday() &&
      (membership.is_lifetime_snapshot ||
        !membership.end_date ||
        membership.end_date >= getDhakaToday())
    )
  })

  // Early renewal: paid membership with a future start date.
  const upcomingMembership = memberships.find(
    (membership) =>
      getMembershipPosition(membership) === 'upcoming',
  )

  const pendingMembership = memberships.find(
    (membership) => membership.status === 'pending_payment',
  )

  const selectedPlan = plans.find(
    (plan) => plan.id === selectedPlanId,
  )

  const contactNumber = settings?.phone
  const whatsappNumber = settings?.whatsapp?.replace(/\D/g, '')

  async function handlePurchaseRequest() {
    if (!selectedPlan) {
      setError('Please select a membership plan.')
      return
    }

    if (pendingMembership) {
      setError(
        'You already have a pending membership request. Please wait for the gym to review it.',
      )
      return
    }

    if (
      (paymentMethod === 'bkash' || paymentMethod === 'nagad') &&
      !transactionId.trim()
    ) {
      setError('Please enter your payment Transaction ID.')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    const { error: requestError } = await supabase.rpc(
      'create_membership_request',
      {
        p_plan_id: selectedPlan.id,
        p_payment_method: paymentMethod,
        p_transaction_id:
          paymentMethod === 'cash' ? null : transactionId.trim(),
      },
    )

    if (requestError) {
      setError(requestError.message)
      setSubmitting(false)
      return
    }

    setTransactionId('')
    setSuccess(
      'Your membership request has been submitted. The gym will verify your payment before activating your membership.',
    )

    await loadData()
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[#F2E8DC]">
        <RefreshCw className="mr-3 animate-spin" size={20} />
        Loading membership...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      {/* Header */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#FF6B24]">
          Your membership
        </p>

        <h1 className="text-3xl font-black text-[#F2E8DC] sm:text-4xl">
          Membership & Plans
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#F2E8DC]/50">
          Manage your membership, explore available plans and review your
          payment history.
        </p>
      </div>

      {/* Error and success messages */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
          {success}
        </div>
      )}

      {/* Current membership */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="text-[#FF6B24]" size={19} />
          <h2 className="text-lg font-bold text-[#F2E8DC]">
            Current membership
          </h2>
        </div>

        {activeMembership ? (
          <div className="rounded-2xl border border-[#FF6B24]/30 bg-gradient-to-br from-[#303030] to-[#1C1C1C] p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#F2E8DC]/40">
                  Your current plan
                </p>

                <h3 className="mt-2 text-2xl font-black text-[#F2E8DC]">
                  {activeMembership.plan_name_snapshot}
                </h3>

                <p className="mt-1 text-sm text-[#F2E8DC]/50">
                  {activeMembership.is_lifetime_snapshot
                    ? 'Lifetime membership'
                    : `${activeMembership.duration_months_snapshot} months`}
                </p>
              </div>

              <span className="rounded-full bg-green-500/10 px-4 py-2 text-xs font-bold text-green-400">
                CURRENT
              </span>
            </div>

            <div className="mt-8 grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[#F2E8DC]/40">Expires</p>

                {activeMembership.is_lifetime_snapshot ? (
                  <p className="mt-1 font-bold text-[#F2E8DC]">Never</p>
                ) : (
                  <>
                    <p className="mt-1 font-bold text-[#F2E8DC]">
                      {expiresInLabel(activeMembership.end_date)}
                    </p>

                    <p className="mt-1 text-xs text-[#F2E8DC]/40">
                      on {formatDate(activeMembership.end_date)}
                    </p>
                  </>
                )}
              </div>

              <div>
                <p className="text-xs text-[#F2E8DC]/40">Amount paid</p>
                <p className="mt-1 font-bold text-[#FF6B24]">
                  {currency(activeMembership.amount_paid)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#1C1C1C] p-6">
            <p className="font-bold text-[#F2E8DC]">
              You don't have an active membership.
            </p>
            <p className="mt-2 text-sm text-[#F2E8DC]/45">
              Choose a plan below to get started.
            </p>
          </div>
        )}
      </section>

      {/* Upcoming membership */}
      {upcomingMembership && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Clock className="text-blue-400" size={19} />
            <h2 className="text-lg font-bold text-[#F2E8DC]">
              Upcoming membership
            </h2>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-[#1C1C1C] p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
                  Paid renewal
                </p>

                <h3 className="mt-2 text-2xl font-black text-[#F2E8DC]">
                  {upcomingMembership.plan_name_snapshot}
                </h3>

                <p className="mt-1 text-sm text-[#F2E8DC]/50">
                  {upcomingMembership.is_lifetime_snapshot
                    ? 'Lifetime membership'
                    : `${upcomingMembership.duration_months_snapshot} months`}
                </p>
              </div>

              <span className="rounded-full bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-400">
                UPCOMING
              </span>
            </div>

            <div className="mt-8 grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[#F2E8DC]/40">Starts on</p>
                <p className="mt-1 font-bold text-[#F2E8DC]">
                  {formatDate(upcomingMembership.start_date)}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#F2E8DC]/40">Ends on</p>
                <p className="mt-1 font-bold text-[#F2E8DC]">
                  {upcomingMembership.is_lifetime_snapshot
                    ? 'Never'
                    : formatDate(upcomingMembership.end_date)}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#F2E8DC]/40">Amount paid</p>
                <p className="mt-1 font-bold text-[#FF6B24]">
                  {currency(upcomingMembership.amount_paid)}
                </p>
              </div>
            </div>

            <p className="mt-6 rounded-xl bg-blue-500/5 p-4 text-sm leading-6 text-blue-300/80">
              Your renewal has been recorded. This membership will become
              valid on its scheduled start date. Your current membership
              remains valid until its expiry date.
            </p>
          </div>
        </section>
      )}

      {/* Pending request */}
      {pendingMembership && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <Clock className="mt-0.5 shrink-0 text-yellow-400" size={19} />

          <div>
            <p className="font-bold text-yellow-300">
              Membership request awaiting confirmation
            </p>

            <p className="mt-1 text-sm text-[#F2E8DC]/50">
              Your request for {pendingMembership.plan_name_snapshot} is
              being reviewed. You cannot submit another request until this
              one is resolved.
            </p>
          </div>
        </div>
      )}

      {/* Available plans */}
      <section>
        <div className="mb-5 flex items-center gap-2">
          <Dumbbell className="text-[#FF6B24]" size={19} />
          <h2 className="text-lg font-bold text-[#F2E8DC]">
            Available plans
          </h2>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#1C1C1C] p-8 text-center text-sm text-[#F2E8DC]/50">
            No membership plans are currently available.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => {
              const selected = selectedPlanId === plan.id
              const discounted =
                plan.discounted_price !== null &&
                Number(plan.discounted_price) <
                  Number(plan.regular_price)

              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`relative rounded-2xl border p-6 text-left transition ${
                    selected
                      ? 'border-[#FF6B24] bg-[#FF6B24]/5'
                      : 'border-white/10 bg-[#1C1C1C] hover:border-white/25'
                  }`}
                >
                  {selected && (
                    <span className="absolute right-5 top-5 flex h-6 w-6 items-center justify-center rounded-full bg-[#FF6B24] text-[#F2E8DC]">
                      <Check size={14} />
                    </span>
                  )}

                  <p className="text-xs font-bold uppercase tracking-widest text-[#FF6B24]">
                    {durationLabel(plan)}
                  </p>

                  <h3 className="mt-3 text-xl font-black text-[#F2E8DC]">
                    {plan.name}
                  </h3>

                  <div className="mt-5 flex flex-wrap items-baseline gap-2">
                    <span className="text-3xl font-black text-[#F2E8DC]">
                      {currency(discounted ? plan.discounted_price : plan.regular_price)}
                    </span>

                    {discounted && (
                      <span className="text-sm text-[#F2E8DC]/35 line-through">
                        {currency(plan.regular_price)}
                      </span>
                    )}
                  </div>

                  <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
                    {getBenefits(plan.benefits).map((benefit, index) => (
                      <div
                        key={`${plan.id}-${index}`}
                        className="flex items-start gap-2 text-sm text-[#F2E8DC]/65"
                      >
                        <Check
                          size={16}
                          className="mt-0.5 shrink-0 text-[#FF6B24]"
                        />
                        <span>
                          {typeof benefit === 'string'
                            ? benefit
                            : JSON.stringify(benefit)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p
                    className={`mt-6 text-xs font-bold ${
                      selected ? 'text-[#FF6B24]' : 'text-[#F2E8DC]/35'
                    }`}
                  >
                    {selected ? 'SELECTED PLAN' : 'SELECT THIS PLAN'}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Purchase request */}
      {plans.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-[#1C1C1C] p-6 sm:p-8">
          <div className="mb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF6B24]">
              Get started
            </p>

            <h2 className="text-2xl font-black text-[#F2E8DC]">
              Request membership
            </h2>

            <p className="mt-2 text-sm text-[#F2E8DC]/45">
              Select your payment method and submit your request.
            </p>
          </div>

          {pendingMembership ? (
            <p className="rounded-xl bg-yellow-500/10 p-4 text-sm text-yellow-300">
              You already have a pending request. Please wait for the gym
              to confirm or reject it before submitting another one.
            </p>
          ) : (
            <div className="space-y-6">
              {selectedPlan && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#303030] p-4">
                  <div>
                    <p className="text-xs text-[#F2E8DC]/40">
                      Selected plan
                    </p>
                    <p className="mt-1 font-bold text-[#F2E8DC]">
                      {selectedPlan.name}
                    </p>
                  </div>

                  <p className="text-xl font-black text-[#FF6B24]">
                    {currency(
                      selectedPlan.discounted_price !== null &&
                      Number(selectedPlan.discounted_price) <
                        Number(selectedPlan.regular_price)
                        ? selectedPlan.discounted_price
                        : selectedPlan.regular_price,
                    )}
                  </p>
                </div>
              )}

              <div>
                <p className="mb-3 text-sm font-bold text-[#F2E8DC]">
                  Payment method
                </p>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { value: 'bkash', label: 'bKash' },
                    { value: 'nagad', label: 'Nagad' },
                    { value: 'cash', label: 'Cash at gym' },
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(method.value)
                        setTransactionId('')
                      }}
                      className={`rounded-xl border p-4 text-sm font-bold transition ${
                        paymentMethod === method.value
                          ? 'border-[#FF6B24] bg-[#FF6B24]/10 text-[#F2E8DC]'
                          : 'border-white/10 text-[#F2E8DC]/50 hover:border-white/25'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'cash' ? (
                <div className="rounded-xl border border-white/10 bg-[#303030]/50 p-4 text-sm leading-6 text-[#F2E8DC]/60">
                  Visit the gym and pay the full amount in cash. Your
                  membership will be activated after the gym confirms
                  receipt of your payment.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-white/10 bg-[#303030]/50 p-4 text-sm leading-6 text-[#F2E8DC]/60">
                    <p className="font-bold text-[#F2E8DC]">
                      Before submitting:
                    </p>
                    <p className="mt-2">
                      Contact the gym to obtain its current {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} payment number and instructions.
                      Send the full payment, then enter your Transaction ID
                      below.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-4">
                      {contactNumber && (
                        <a
                          href={`tel:${contactNumber}`}
                          className="inline-flex items-center gap-2 font-bold text-[#FF6B24]"
                        >
                          <Phone size={15} />
                          Call gym
                        </a>
                      )}

                      {whatsappNumber && (
                        <a
                          href={`https://wa.me/${whatsappNumber}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 font-bold text-[#FF6B24]"
                        >
                          <MessageCircle size={15} />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="transactionId"
                      className="mb-2 block text-sm font-bold text-[#F2E8DC]"
                    >
                      Transaction ID
                    </label>

                    <input
                      id="transactionId"
                      value={transactionId}
                      onChange={(event) =>
                        setTransactionId(event.target.value)
                      }
                      placeholder="Enter your payment TrxID"
                      className="w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm text-[#F2E8DC] outline-none transition placeholder:text-white/25 focus:border-[#FF6B24]"
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handlePurchaseRequest}
                disabled={submitting || !selectedPlan}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] px-6 py-4 text-sm font-bold text-[#F2E8DC] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Sparkles size={17} />
                    Submit membership request
                  </>
                )}
              </button>

              <p className="flex items-center justify-center gap-2 text-center text-xs text-[#F2E8DC]/35">
                <ShieldCheck size={14} />
                Membership activates only after payment confirmation.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Membership history */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <History className="text-[#FF6B24]" size={19} />
          <h2 className="text-lg font-bold text-[#F2E8DC]">
            Membership history
          </h2>
        </div>

        {memberships.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#1C1C1C] p-6 text-sm text-[#F2E8DC]/40">
            No membership records yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-[#303030] text-xs uppercase tracking-wider text-[#F2E8DC]/40">
                <tr>
                  <th className="px-5 py-4">Plan</th>
                  <th className="px-5 py-4">Start date</th>
                  <th className="px-5 py-4">End date</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {memberships.map((membership) => {
                  const displayStatus = getMembershipPosition(membership)

                  return (
                    <tr key={membership.id} className="bg-[#1C1C1C]">
                      <td className="px-5 py-4 font-bold text-[#F2E8DC]">
                        {membership.plan_name_snapshot}
                      </td>

                      <td className="px-5 py-4 text-[#F2E8DC]/50">
                        {formatDate(membership.start_date)}
                      </td>

                      <td className="px-5 py-4 text-[#F2E8DC]/50">
                        {membership.is_lifetime_snapshot
                          ? 'Never'
                          : formatDate(membership.end_date)}
                      </td>

                      <td className="px-5 py-4 text-[#F2E8DC]/70">
                        {currency(membership.amount_paid)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(displayStatus)}`}
                        >
                          {statusLabel(displayStatus)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Payment history */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="text-[#FF6B24]" size={19} />
          <h2 className="text-lg font-bold text-[#F2E8DC]">
            Payment history
          </h2>
        </div>

        {payments.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#1C1C1C] p-6 text-sm text-[#F2E8DC]/40">
            No payment records yet.
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#1C1C1C] p-5"
              >
                <div>
                  <p className="font-bold capitalize text-[#F2E8DC]">
                    {payment.payment_method}
                  </p>

                  <p className="mt-1 text-xs text-[#F2E8DC]/40">
                    {formatDate(payment.created_at?.slice(0, 10))}
                  </p>

                  {payment.transaction_id && (
                    <p className="mt-1 text-xs text-[#F2E8DC]/35">
                      TrxID: {payment.transaction_id}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="font-bold text-[#F2E8DC]">
                    {currency(payment.amount)}
                  </p>

                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${statusStyle(payment.status)}`}
                  >
                    {statusLabel(payment.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
