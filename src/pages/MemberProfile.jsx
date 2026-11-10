import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { User, ShieldCheck, Clock, Save, Send } from 'lucide-react'

const inputClass =
  'w-full rounded-lg border border-white/10 bg-[#141414] px-4 py-3 text-[#F2E8DC] outline-none transition focus:border-[#FF6B24]'

export default function MemberProfile() {
  const { user } = useAuth()

  const [profile, setProfile] = useState(null)
  const [membership, setMembership] = useState(null)
  const [request, setRequest] = useState(null)

  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')

  const [changeForm, setChangeForm] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
    gender: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadData()
  }, [user?.id])

  async function loadData() {
    if (!user?.id) return

    setLoading(true)

    const [{ data: profileData }, { data: membershipData }, { data: requestData }] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('memberships')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('profile_change_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

    setProfile(profileData)
    setMembership(membershipData)
    setRequest(requestData)

    if (profileData) {
      setHeight(profileData.height_cm ?? '')
      setWeight(profileData.weight_kg ?? '')
      setChangeForm({
        full_name: profileData.full_name ?? '',
        phone: profileData.phone ?? '',
        date_of_birth: profileData.date_of_birth ?? '',
        gender: profileData.gender ?? '',
      })
    }

    setLoading(false)
  }

  async function saveBodyMetrics() {
    setSaving(true)
    setError('')
    setSuccess('')

    const { error } = await supabase
      .from('profiles')
      .update({
        height_cm: height || null,
        weight_kg: weight || null,
      })
      .eq('id', user.id)

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess('Height and weight updated.')
    loadData()
  }

  async function submitChangeRequest(e) {
    e.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    const changes = {}

    if (changeForm.full_name !== (profile.full_name ?? ''))
      changes.full_name = changeForm.full_name

    if (changeForm.phone !== (profile.phone ?? ''))
      changes.phone = changeForm.phone

    if (
      changeForm.date_of_birth !==
      (profile.date_of_birth ?? '')
    )
      changes.date_of_birth = changeForm.date_of_birth

    if (changeForm.gender !== (profile.gender ?? ''))
      changes.gender = changeForm.gender

    if (Object.keys(changes).length === 0) {
      setSaving(false)
      setError('No changes detected.')
      return
    }

    const { error } = await supabase
      .from('profile_change_requests')
      .insert({
        user_id: user.id,
        requested_changes: changes,
        status: 'pending',
      })

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess('Profile change request submitted.')
    loadData()
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-[#F2E8DC]/50">
        Loading profile...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF6B24]">
          Member
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#F2E8DC]">
          My Profile
        </h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-300">
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#1C1C1C] p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-[#FF6B24]/10 p-3 text-[#FF6B24]">
              <User size={22} />
            </div>
            <div>
              <h2 className="font-bold">Personal Information</h2>
              <p className="text-sm text-[#F2E8DC]/40">
                Request approval for sensitive changes.
              </p>
            </div>
          </div>

          <form
            onSubmit={submitChangeRequest}
            className="space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm">
                Full name
              </label>
              <input
                className={inputClass}
                value={changeForm.full_name}
                onChange={(e) =>
                  setChangeForm({
                    ...changeForm,
                    full_name: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm">
                Phone
              </label>
              <input
                className={inputClass}
                value={changeForm.phone}
                onChange={(e) =>
                  setChangeForm({
                    ...changeForm,
                    phone: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm">
                Date of birth
              </label>
              <input
                type="date"
                className={inputClass}
                value={changeForm.date_of_birth}
                onChange={(e) =>
                  setChangeForm({
                    ...changeForm,
                    date_of_birth: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm">
                Gender
              </label>
              <select
                className={inputClass}
                value={changeForm.gender}
                onChange={(e) =>
                  setChangeForm({
                    ...changeForm,
                    gender: e.target.value,
                  })
                }
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] px-6 py-3 font-bold text-[#F2E8DC] disabled:opacity-50"
            >
              <Send size={17} />
              Submit for approval
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#1C1C1C] p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-[#FF6B24]/10 p-3 text-[#FF6B24]">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="font-bold">
                  Body Metrics
                </h2>
                <p className="text-sm text-[#F2E8DC]/40">
                  These update immediately.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm">
                  Height (cm)
                </label>
                <input
                  type="number"
                  className={inputClass}
                  value={height}
                  onChange={(e) =>
                    setHeight(e.target.value)
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  className={inputClass}
                  value={weight}
                  onChange={(e) =>
                    setWeight(e.target.value)
                  }
                />
              </div>

              <button
                onClick={saveBodyMetrics}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] px-6 py-3 font-bold text-[#F2E8DC] disabled:opacity-50"
              >
                <Save size={17} />
                Save metrics
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#1C1C1C] p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-[#FF6B24]/10 p-3 text-[#FF6B24]">
                <Clock size={22} />
              </div>
              <div>
                <h2 className="font-bold">
                  Membership
                </h2>
                <p className="text-sm text-[#F2E8DC]/40">
                  Your current access.
                </p>
              </div>
            </div>

            {membership ? (
              <>
                <p className="text-lg font-bold">
                  {membership.plan_name_snapshot}
                </p>
                <p className="mt-1 text-[#F2E8DC]/50">
                  Ends:{' '}
                  {membership.end_date || 'Lifetime'}
                </p>
              </>
            ) : (
              <p className="text-[#F2E8DC]/40">
                No active membership.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#1C1C1C] p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-[#FF6B24]/10 p-3 text-[#FF6B24]">
                <Clock size={22} />
              </div>
              <div>
                <h2 className="font-bold">
                  Latest Change Request
                </h2>
                <p className="text-sm text-[#F2E8DC]/40">
                  Track your latest request.
                </p>
              </div>
            </div>

            {request ? (
              <>
                <p className="font-bold capitalize">
                  {request.status}
                </p>
                <pre className="mt-3 whitespace-pre-wrap text-sm text-[#F2E8DC]/50">
                  {JSON.stringify(
                    request.requested_changes,
                    null,
                    2,
                  )}
                </pre>
              </>
            ) : (
              <p className="text-[#F2E8DC]/40">
                No requests submitted yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}