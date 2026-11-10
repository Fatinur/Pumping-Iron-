import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import RecordPaymentForm from '../components/RecordPaymentForm'
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Wallet,
} from 'lucide-react'

function monthKey(dateString) {
  const d = new Date(dateString)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMoney(value) {
  return `৳${Number(value || 0).toLocaleString()}`
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString()
}

export default function AdminPayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(
    monthKey(new Date().toISOString()),
  )

  useEffect(() => {
    loadPayments()
  }, [])

  async function loadPayments() {
    setLoading(true)
    setError('')

    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })

    if (paymentError) {
      setError(paymentError.message)
      setPayments([])
      setLoading(false)
      return
    }

    const rows = paymentData || []
    const userIds = [...new Set(rows.map((p) => p.user_id))]
    const membershipIds = [...new Set(rows.map((p) => p.membership_id))]

    let profilesById = {}
    let membershipsById = {}

    if (userIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', userIds)

      if (profileError) {
        setError(profileError.message)
        setPayments([])
        setLoading(false)
        return
      }

      profilesById = Object.fromEntries(
        (profiles || []).map((p) => [p.id, p]),
      )
    }

    if (membershipIds.length > 0) {
      const { data: memberships, error: membershipError } = await supabase
        .from('memberships')
        .select('id, plan_name_snapshot, start_date, end_date, status')
        .in('id', membershipIds)

      if (membershipError) {
        setError(membershipError.message)
        setPayments([])
        setLoading(false)
        return
      }

      membershipsById = Object.fromEntries(
        (memberships || []).map((m) => [m.id, m]),
      )
    }

    setPayments(
      rows.map((p) => ({
        ...p,
        member: profilesById[p.user_id] || null,
        membership: membershipsById[p.membership_id] || null,
      })),
    )
    setLoading(false)
  }

  async function handleReview(paymentId, action) {
    const confirmed = window.confirm(
      action === 'approve'
        ? 'Approve this payment and activate the membership?'
        : 'Reject this payment?',
    )

    if (!confirmed) return

    setProcessingId(paymentId)
    setError('')
    setSuccess('')

    const functionName =
      action === 'approve'
        ? 'confirm_membership_payment'
        : 'reject_membership_payment'

    const { error: rpcError } = await supabase.rpc(functionName, {
      p_payment_id: paymentId,
    })

    setProcessingId(null)

    if (rpcError) {
      setError(rpcError.message)
      return
    }

    setSuccess(
      action === 'approve'
        ? 'Payment approved. Membership activated.'
        : 'Payment rejected.',
    )

    await loadPayments()
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-[#F2E8DC]/50">
        Loading payments...
      </div>
    )
  }

  const pending = payments.filter((p) => p.status === 'pending')

  const pendingTotal = pending.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0,
  )

  const confirmedInMonth = payments.filter(
    (p) =>
      p.status === 'confirmed' &&
      p.confirmed_at &&
      monthKey(p.confirmed_at) === selectedMonth,
  )

  const collectedTotal = confirmedInMonth.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0,
  )

  const historyInMonth = payments.filter(
    (p) =>
      p.status !== 'pending' &&
      monthKey(p.confirmed_at || p.created_at) === selectedMonth,
  )

  const badgeClass = (status) =>
    status === 'pending'
      ? 'bg-yellow-500/10 text-yellow-400'
      : status === 'confirmed'
        ? 'bg-green-500/10 text-green-400'
        : 'bg-red-500/10 text-red-400'

  return (
    <div className="space-y-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF8248]">
            Administration
          </p>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Payments
          </h1>

          <p className="mt-3 text-sm text-white/45">
            Approve member payments and track your collections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-white/[0.09] bg-[#202020] px-4 py-3 text-sm text-[#F2E8DC] outline-none focus:border-[#FF6B24]/70"
          />

          <button
            onClick={loadPayments}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm font-bold text-[#F2E8DC] transition hover:bg-white/5"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
          {success}
        </div>
      )}

      {/* Totals */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/[0.07] bg-[#181818] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/45">Collected this month</span>
            <Wallet size={19} className="text-[#FFB347]" />
          </div>

          <p className="mt-5 text-3xl font-black text-[#F2E8DC]">
            {formatMoney(collectedTotal)}
          </p>

          <p className="mt-2 text-xs text-white/35">
            {confirmedInMonth.length} approved payment
            {confirmedInMonth.length === 1 ? '' : 's'} in the selected month
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#181818] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/45">Pending approval</span>
            <Wallet size={19} className="text-[#FFB347]" />
          </div>

          <p className="mt-5 text-3xl font-black text-[#FF6B24]">
            {formatMoney(pendingTotal)}
          </p>

          <p className="mt-2 text-xs text-white/35">
            {pending.length} payment{pending.length === 1 ? '' : 's'} waiting
          </p>
        </div>
      </section>
      <RecordPaymentForm onRecorded={loadPayments} />
      {/* Pending */}
      <section>
        <h2 className="mb-5 text-lg font-bold text-[#F2E8DC]">
          PENDING APPROVAL
        </h2>

        {pending.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] bg-[#181818] px-6 py-10 text-center text-sm text-white/40">
            No payments waiting for approval.
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-white/[0.07] bg-[#181818] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-[#F2E8DC]">
                      {p.member?.full_name || 'Unknown member'}
                    </h3>

                    <p className="mt-1 text-sm text-white/40">
                      {p.member?.phone || 'No phone on file'}
                    </p>

                    <p className="mt-3 text-sm text-[#F2E8DC]/70">
                      {p.membership?.plan_name_snapshot || 'Plan'}
                    </p>
                  </div>

                  <p className="text-2xl font-black text-[#FF6B24]">
                    {formatMoney(p.amount)}
                  </p>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-lg bg-[#141414] px-4 py-3">
                    <p className="text-xs text-white/35">Method</p>
                    <p className="mt-1 font-bold capitalize text-[#F2E8DC]">
                      {p.payment_method}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#141414] px-4 py-3">
                    <p className="text-xs text-white/35">Transaction ID</p>
                    <p className="mt-1 break-all font-bold text-[#F2E8DC]">
                      {p.transaction_id || '—'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#141414] px-4 py-3">
                    <p className="text-xs text-white/35">Submitted</p>
                    <p className="mt-1 font-bold text-[#F2E8DC]">
                      {new Date(p.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => handleReview(p.id, 'approve')}
                    disabled={processingId === p.id}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] px-5 py-3 text-sm font-bold text-[#F2E8DC] transition duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-lg hover:shadow-[#FF6B24]/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 size={17} />
                    Approve
                  </button>

                  <button
                    onClick={() => handleReview(p.id, 'reject')}
                    disabled={processingId === p.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-5 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <XCircle size={17} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* History */}
      <section>
        <h2 className="mb-5 text-lg font-bold text-[#F2E8DC]">
          HISTORY
        </h2>

        {historyInMonth.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] bg-[#181818] px-6 py-10 text-center text-sm text-white/40">
            No payment history for this month.
          </div>
        ) : (
          <div className="space-y-3">
            {historyInMonth.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-[#181818] px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="font-bold text-[#F2E8DC]">
                    {p.member?.full_name || 'Unknown member'}
                  </p>

                  <p className="mt-1 text-xs text-white/40">
                    {p.membership?.plan_name_snapshot || 'Plan'} ·{' '}
                    <span className="capitalize">{p.payment_method}</span>
                    {p.membership?.start_date &&
                      ` · ${formatDate(p.membership.start_date)} to ${formatDate(p.membership.end_date)}`}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <p className="font-black text-[#F2E8DC]">
                    {formatMoney(p.amount)}
                  </p>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${badgeClass(p.status)}`}
                  >
                    {p.status}
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