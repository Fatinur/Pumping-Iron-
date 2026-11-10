
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  RefreshCw,
  Save,
  Plus,
  X,
  Trash2,
  Archive,
  RotateCcw,
  Pencil,
  Check,
  Clock,
  // eslint-disable-next-line no-shadow-restricted-names
  Infinity,
   Dumbbell,
} from 'lucide-react'

function formatMoney(value) {
  return `৳${Number(value || 0).toLocaleString()}`
}

function durationLabel(plan) {
  if (plan.is_lifetime) return 'Lifetime'

  const months = plan.duration_months
  return `${months} ${months === 1 ? 'month' : 'months'}`
}

const inputClass =
  'w-full rounded-lg border border-white/[0.09] bg-[#202020] px-4 py-3 text-sm text-[#F2E8DC] placeholder:text-white/25 outline-none transition-all duration-200 focus:border-[#FF6B24]/70 focus:ring-2 focus:ring-[#FF6B24]/10'

const labelClass = 'mb-2 block text-sm font-medium text-[#D8D0C7]'

function getBenefitsText(benefits) {
  if (!Array.isArray(benefits)) return ''
  return benefits.join('\n')
}

function getBenefitsArray(value) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function validatePlan({
  name,
  durationMonths,
  isLifetime,
  regular,
  discounted,
}) {
  if (!name.trim()) return 'Enter a plan name.'

  if (
    !isLifetime &&
    (!Number.isInteger(Number(durationMonths)) ||
      Number(durationMonths) <= 0)
  ) {
    return 'Enter a valid duration in months.'
  }

  const regularValue = regular.trim() === '' ? NaN : Number(regular)

  const discountedValue =
    discounted.trim() === '' ? null : Number(discounted)

  if (!Number.isFinite(regularValue) || regularValue < 0) {
    return 'Enter a valid regular price.'
  }

  if (
    discountedValue !== null &&
    (!Number.isFinite(discountedValue) || discountedValue < 0)
  ) {
    return 'Enter a valid discounted price, or leave it empty.'
  }

  if (discountedValue !== null && discountedValue > regularValue) {
    return 'The discounted price cannot be higher than the regular price.'
  }

  return ''
}

function PlanForm({
  initialPlan,
  onCancel,
  onSaved,
}) {
  const isEditing = Boolean(initialPlan)

  const [name, setName] = useState(initialPlan?.name || '')
  const [durationMonths, setDurationMonths] = useState(
    initialPlan?.duration_months
      ? String(initialPlan.duration_months)
      : '1',
  )
  const [isLifetime, setIsLifetime] = useState(
    initialPlan?.is_lifetime || false,
  )
  const [regular, setRegular] = useState(
    initialPlan ? String(Number(initialPlan.regular_price)) : '',
  )
  const [discounted, setDiscounted] = useState(
    initialPlan?.discounted_price == null
      ? ''
      : String(Number(initialPlan.discounted_price)),
  )
  const [benefits, setBenefits] = useState(
    getBenefitsText(initialPlan?.benefits),
  )
  const [active, setActive] = useState(
    initialPlan ? initialPlan.is_active : true,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const validationError = validatePlan({
      name,
      durationMonths,
      isLifetime,
      regular,
      discounted,
    })

    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    const payload = {
      name: name.trim(),
      duration_months: isLifetime ? null : Number(durationMonths),
      is_lifetime: isLifetime,
      regular_price: Number(regular),
      discounted_price:
        discounted.trim() === '' ? null : Number(discounted),
      benefits: getBenefitsArray(benefits),
      is_active: active,
      updated_at: new Date().toISOString(),
    }

    let result

    if (isEditing) {
      result = await supabase
        .from('membership_plans')
        .update(payload)
        .eq('id', initialPlan.id)
        .select('id')
    } else {
      result = await supabase
        .from('membership_plans')
        .insert(payload)
        .select('id')
    }

    setSaving(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    if (!result.data || result.data.length === 0) {
      setError('The plan could not be saved.')
      return
    }

    await onSaved()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-[#FF6B24]/25 bg-[#1B1B1B] p-5 sm:p-6"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#F2E8DC]">
            {isEditing ? 'Edit Plan' : 'Create New Plan'}
          </h2>

          <p className="mt-1 text-sm text-white/40">
            {isEditing
              ? 'Update this membership plan.'
              : 'Add a membership option for your gym.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
          aria-label="Close form"
        >
          <X size={20} />
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Plan name</label>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Monthly Membership"
            maxLength={80}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Plan duration</label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsLifetime(false)}
              className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-bold transition ${
                !isLifetime
                  ? 'border-[#FF6B24]/50 bg-[#FF6B24]/10 text-[#FFB347]'
                  : 'border-white/10 bg-[#202020] text-white/45'
              }`}
            >
              <Clock size={16} />
              Fixed duration
            </button>

            <button
              type="button"
              onClick={() => setIsLifetime(true)}
              className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-bold transition ${
                isLifetime
                  ? 'border-[#FF6B24]/50 bg-[#FF6B24]/10 text-[#FFB347]'
                  : 'border-white/10 bg-[#202020] text-white/45'
              }`}
            >
              <Infinity size={17} />
              Lifetime
            </button>
          </div>
        </div>

        {!isLifetime && (
          <div>
            <label className={labelClass}>Duration (months)</label>
            <input
              className={inputClass}
              type="number"
              min="1"
              step="1"
              value={durationMonths}
              onChange={(e) => setDurationMonths(e.target.value)}
              required
            />
          </div>
        )}

        <div>
          <label className={labelClass}>Regular price (৳)</label>
          <input
            className={inputClass}
            type="number"
            min="0"
            step="any"
            value={regular}
            onChange={(e) => setRegular(e.target.value)}
            placeholder="e.g. 2500"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Discounted price (৳)</label>
          <input
            className={inputClass}
            type="number"
            min="0"
            step="any"
            value={discounted}
            onChange={(e) => setDiscounted(e.target.value)}
            placeholder="Leave empty for no discount"
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>
            Benefits <span className="text-white/30">(Optional)</span>
          </label>

          <textarea
            className={`${inputClass} min-h-28 resize-y`}
            value={benefits}
            onChange={(e) => setBenefits(e.target.value)}
            placeholder={'24/7 gym access\nLocker facility\nPersonal workout guidance'}
          />

          <p className="mt-2 text-xs text-white/35">
            Enter one benefit per line.
          </p>
        </div>

        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/[0.07] bg-[#202020] p-4">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 accent-[#FF6B24]"
            />

            <span>
              <span className="block text-sm font-bold text-[#F2E8DC]">
                Visible to members
              </span>
              <span className="mt-1 block text-xs text-white/40">
                Members can see and purchase this plan.
              </span>
            </span>
          </label>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] px-5 py-3 text-sm font-bold text-[#F2E8DC] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={16} />
          {saving
            ? 'Saving...'
            : isEditing
              ? 'Save changes'
              : 'Create plan'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-white/10 px-5 py-3 text-sm font-bold text-white/60 transition hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function PlanCard({ plan, onEdit, onRefresh }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleVisibility() {
    setBusy(true)
    setError('')
    setSuccess('')

    const { error: updateError } = await supabase
      .from('membership_plans')
      .update({
        is_active: !plan.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', plan.id)

    setBusy(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(
      plan.is_active
        ? 'Plan hidden from members.'
        : 'Plan is now visible to members.',
    )

    await onRefresh()
  }

  async function handleRemove() {
    const { count, error: countError } = await supabase
      .from('memberships')
      .select('id', { count: 'exact', head: true })
      .eq('plan_id', plan.id)

    if (countError) {
      setError(countError.message)
      return
    }

    if (count > 0) {
      const confirmed = window.confirm(
        `This plan has ${count} existing membership record(s).\n\nIt cannot be permanently deleted safely. Archive it instead?`,
      )

      if (!confirmed) return

      setBusy(true)
      setError('')
      setSuccess('')

      const { error: archiveError } = await supabase
        .from('membership_plans')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', plan.id)

      setBusy(false)

      if (archiveError) {
        setError(archiveError.message)
        return
      }

      setSuccess('Plan archived. Existing memberships are preserved.')
      await onRefresh()
      return
    }

    const confirmed = window.confirm(
      `Permanently delete "${plan.name}"?\n\nThis plan has no existing memberships. This action cannot be undone.`,
    )

    if (!confirmed) return

    setBusy(true)
    setError('')
    setSuccess('')

    const { error: deleteError } = await supabase
      .from('membership_plans')
      .delete()
      .eq('id', plan.id)

    setBusy(false)

    if (deleteError) {
      setError(
        'Could not delete this plan. It may now be referenced by another record. Try archiving it instead. ' +
          deleteError.message,
      )
      return
    }

    setSuccess('Plan permanently deleted.')
    await onRefresh()
  }

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#181818] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FF6B24]">
              {durationLabel(plan)}
            </span>

            {!plan.is_active && (
              <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/45">
                Archived
              </span>
            )}
          </div>

          <h3 className="mt-2 text-xl font-black text-[#F2E8DC]">
            {plan.name}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-lg font-black text-[#F2E8DC]">
              {formatMoney(
                plan.discounted_price ?? plan.regular_price,
              )}
            </span>

            {plan.discounted_price !== null && (
              <span className="text-sm text-white/35 line-through">
                {formatMoney(plan.regular_price)}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleVisibility}
          disabled={busy}
          className={`rounded-full px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${
            plan.is_active
              ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
              : 'bg-white/[0.06] text-white/50 hover:bg-white/10'
          }`}
        >
          {plan.is_active ? 'VISIBLE TO MEMBERS' : 'HIDDEN'}
        </button>
      </div>

      {Array.isArray(plan.benefits) && plan.benefits.length > 0 && (
        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/35">
            Benefits
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {plan.benefits.map((benefit, index) => (
              <div
                key={`${benefit}-${index}`}
                className="flex items-center gap-2 text-sm text-white/55"
              >
                <Check size={14} className="shrink-0 text-[#FFB347]" />
                {benefit}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
          {success}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2 border-t border-white/[0.06] pt-5">
        <button
          type="button"
          onClick={() => onEdit(plan)}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-bold text-[#F2E8DC] transition hover:bg-white/5 disabled:opacity-50"
        >
          <Pencil size={15} />
          Edit
        </button>

        <button
          type="button"
          onClick={handleRemove}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 px-4 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
        >
          {busy ? (
            <RefreshCw size={15} className="animate-spin" />
          ) : plan.is_active ? (
            <Archive size={15} />
          ) : (
            <Trash2 size={15} />
          )}

          {busy
            ? 'Working...'
            : plan.is_active
              ? 'Remove'
              : 'Delete / Archive'}
        </button>
      </div>
    </div>
  )
}

export default function AdminPlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)

  useEffect(() => {
    loadPlans()
  }, [])

  async function loadPlans(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    const { data, error: loadError } = await supabase
      .from('membership_plans')
      .select('*')
      .order('duration_months', {
        ascending: true,
        nullsFirst: false,
      })

    if (loadError) {
      setError(loadError.message)
    } else {
      setPlans(data || [])
    }

    setLoading(false)
    setRefreshing(false)
  }

  async function handleSaved() {
    setShowForm(false)
    setEditingPlan(null)
    await loadPlans()
  }

  function openEdit(plan) {
    setEditingPlan(plan)
    setShowForm(true)
  }

  const visiblePlans = plans.filter(
    (plan) => plan.is_active,
  )

  const archivedPlans = plans.filter(
    (plan) => !plan.is_active,
  )

  const displayedPlans = showArchived
    ? plans
    : visiblePlans

  if (loading) {
    return (
      <div className="py-20 text-center text-[#F2E8DC]/50">
        Loading plans...
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF8248]">
            Administration
          </p>

          <h1 className="text-3xl font-black tracking-tight text-[#F2E8DC] sm:text-4xl">
            Membership Plans
          </h1>

          <p className="mt-3 max-w-xl text-sm text-white/45">
            Create plans, manage prices, and control which
            memberships are available to your members.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadPlans(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm font-bold text-[#F2E8DC] transition hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'animate-spin' : ''}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingPlan(null)
              setShowForm(true)
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] px-5 py-3 text-sm font-bold text-[#F2E8DC] transition hover:-translate-y-0.5 hover:brightness-110"
          >
            <Plus size={17} />
            Add Plan
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <PlanForm
          key={editingPlan?.id || 'new-plan'}
          initialPlan={editingPlan}
          onCancel={() => {
            setShowForm(false)
            setEditingPlan(null)
          }}
          onSaved={handleSaved}
        />
      )}

      {/* Summary */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/[0.07] bg-[#181818] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/45">
              Available Plans
            </span>
            <Dumbbell size={19} className="text-[#FFB347]" />
          </div>

          <p className="mt-4 text-3xl font-black text-[#F2E8DC]">
            {visiblePlans.length}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#181818] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/45">
              Archived Plans
            </span>
            <Archive size={19} className="text-white/40" />
          </div>

          <p className="mt-4 text-3xl font-black text-[#F2E8DC]">
            {archivedPlans.length}
          </p>
        </div>
      </section>

      {/* Plan Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[#F2E8DC]">
          {showArchived ? 'All Plans' : 'Available Plans'}
        </h2>

        <button
          type="button"
          onClick={() => setShowArchived(!showArchived)}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#FFB347] transition hover:text-[#FF8248]"
        >
          {showArchived ? (
            <>
              <RotateCcw size={15} />
              Show active only
            </>
          ) : (
            <>
              <Archive size={15} />
              Show archived ({archivedPlans.length})
            </>
          )}
        </button>
      </div>

      {/* Plans */}
      {displayedPlans.length === 0 ? (
        <div className="rounded-xl border border-white/[0.07] bg-[#181818] px-6 py-12 text-center">
          <Dumbbell
            size={30}
            className="mx-auto text-white/20"
          />

          <p className="mt-4 text-sm text-white/45">
            {showArchived
              ? 'No membership plans found.'
              : 'No active plans. Create a plan to get started.'}
          </p>

          {!showArchived && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-5 text-sm font-bold text-[#FFB347] hover:text-[#FF8248]"
            >
              + Create your first plan
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {displayedPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={openEdit}
              onRefresh={() => loadPlans()}
            />
          ))}
        </div>
      )}
    </div>
  )
}
