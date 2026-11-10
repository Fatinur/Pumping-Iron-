import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PlusCircle } from 'lucide-react'

function formatMoney(value) {
  return `৳${Number(value || 0).toLocaleString()}`
}

export default function RecordPaymentForm({ onRecorded }) {
  const [members, setMembers] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [search, setSearch] = useState('')
  const [memberId, setMemberId] = useState('')
  const [planId, setPlanId] = useState('')
  const [method, setMethod] = useState('cash')
  const [transactionId, setTransactionId] = useState('')

  useEffect(() => {
    async function loadOptions() {
      const [membersResult, plansResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, phone')
          .eq('role', 'member')
          .order('full_name', { ascending: true }),
        supabase
          .from('membership_plans')
          .select('id, name, regular_price, discounted_price, is_active')
          .eq('is_active', true)
          .order('regular_price', { ascending: true }),
      ])

      if (membersResult.error || plansResult.error) {
        setError(
          membersResult.error?.message ||
            plansResult.error?.message ||
            'Failed to load members or plans.',
        )
        setLoading(false)
        return
      }

      setMembers(membersResult.data || [])
      setPlans(plansResult.data || [])
      setLoading(false)
    }

    loadOptions()
  }, [])

  const filteredMembers = members.filter((m) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      (m.full_name || '').toLowerCase().includes(q) ||
      (m.phone || '').toLowerCase().includes(q)
    )
  })

  const selectedPlan = plans.find((p) => p.id === planId)
  const price = selectedPlan
    ? (selectedPlan.discounted_price ?? selectedPlan.regular_price)
    : null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!memberId || !planId) {
      setError('Please choose a member and a plan.')
      return
    }

    const memberName =
      members.find((m) => m.id === memberId)?.full_name || 'this member'

    const confirmed = window.confirm(
      `Record ${formatMoney(price)} (${method}) for ${memberName} and activate the membership?`,
    )

    if (!confirmed) return

    setSubmitting(true)

    const { error: rpcError } = await supabase.rpc(
      'record_membership_payment',
      {
        p_user_id: memberId,
        p_plan_id: planId,
        p_payment_method: method,
        p_transaction_id:
          method === 'cash' ? null : transactionId.trim() || null,
      },
    )

    setSubmitting(false)

    if (rpcError) {
      setError(rpcError.message)
      return
    }

    setSuccess(`Payment recorded. Membership activated for ${memberName}.`)
    setMemberId('')
    setPlanId('')
    setMethod('cash')
    setTransactionId('')
    setSearch('')

    if (onRecorded) await onRecorded()
  }

  const inputClass =
    'w-full rounded-lg border border-white/[0.09] bg-[#202020] px-4 py-3 text-sm text-[#F2E8DC] outline-none transition-all duration-200 focus:border-[#FF6B24]/70 focus:ring-2 focus:ring-[#FF6B24]/10'

  const labelClass = 'mb-2 block text-sm font-medium text-[#D8D0C7]'

  if (loading) {
    return (
      <div className="rounded-xl border border-white/[0.07] bg-[#181818] p-6 text-sm text-white/40">
        Loading form...
      </div>
    )
  }

  return (
    <section>
      <h2 className="mb-5 text-lg font-bold text-[#F2E8DC]">
        RECORD A PAYMENT
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-white/[0.07] bg-[#181818] p-6"
      >
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

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Find member</label>
            <input
              className={inputClass}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone"
            />
          </div>

          <div>
            <label className={labelClass}>Member</label>
            <select
              className={inputClass}
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            >
              <option value="">Select a member</option>
              {filteredMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                  {m.phone ? ` · ${m.phone}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Plan</label>
            <select
              className={inputClass}
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
            >
              <option value="">Select a plan</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {formatMoney(p.discounted_price ?? p.regular_price)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Payment method</label>
            <select
              className={inputClass}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
            </select>
          </div>
        </div>

        {method !== 'cash' && (
          <div>
            <label className={labelClass}>Transaction ID (optional)</label>
            <input
              className={inputClass}
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Leave empty if you don't have one"
            />
          </div>
        )}

        {price !== null && (
          <p className="text-sm text-white/50">
            Amount to record:{' '}
            <span className="font-bold text-[#FF6B24]">
              {formatMoney(price)}
            </span>
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] px-5 py-3 text-sm font-bold text-[#F2E8DC] transition duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-lg hover:shadow-[#FF6B24]/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusCircle size={17} />
          {submitting ? 'Recording...' : 'Record payment'}
        </button>
      </form>
    </section>
  )
}