
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  UserRound,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react'

export default function AdminProfileRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadRequests()
  }, [])

  async function loadRequests() {
    setLoading(true)
    setError('')

    const { data: requestData, error: requestError } = await supabase
      .from('profile_change_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (requestError) {
      setError(requestError.message)
      setRequests([])
      setLoading(false)
      return
    }

    const userIds = [
      ...new Set((requestData || []).map((request) => request.user_id)),
    ]

    let profilesById = {}

    if (userIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', userIds)

      if (profileError) {
        setError(profileError.message)
        setRequests([])
        setLoading(false)
        return
      }

      profilesById = Object.fromEntries(
        (profiles || []).map((profile) => [profile.id, profile]),
      )
    }

    const combinedRequests = (requestData || []).map((request) => ({
      ...request,
      profiles: profilesById[request.user_id] || null,
    }))

    setRequests(combinedRequests)
    setLoading(false)
  }

  async function handleReview(requestId, action) {
    const confirmed = window.confirm(
      action === 'approve'
        ? 'Approve these profile changes?'
        : 'Reject this profile change request?',
    )

    if (!confirmed) return

    setProcessingId(requestId)
    setError('')
    setSuccess('')

    const functionName =
      action === 'approve'
        ? 'approve_profile_change_request'
        : 'reject_profile_change_request'

    const { error } = await supabase.rpc(functionName, {
      p_request_id: requestId,
    })

    setProcessingId(null)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(
      action === 'approve'
        ? 'Profile changes approved successfully.'
        : 'Profile change request rejected.',
    )

    await loadRequests()
  }

  function formatField(field) {
    const labels = {
      full_name: 'Full name',
      phone: 'Phone',
      date_of_birth: 'Date of birth',
      gender: 'Gender',
    }

    return labels[field] || field
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-[#F2E8DC]/50">
        Loading profile requests...
      </div>
    )
  }

  const pendingCount = requests.filter(
    (request) => request.status === 'pending',
  ).length

  return (
    <div className="min-h-screen w-full bg-[#101010] px-4 py-8 text-[#F2E8DC]">
  <div className="mx-auto max-w-6xl space-y-9">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF8248]">
            Administration
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#F2E8DC] sm:text-4xl">
            Profile Requests
          </h1>

          <p className="mt-3 text-sm text-white/45">
            Review and manage member profile changes.
          </p>
        </div>

        <button
          onClick={loadRequests}
          className="inline-flex items-center gap-2 rounded-lg border border-white/[0.07] bg-[#181818] px-4 py-3 text-sm font-bold text-[#F2E8DC] transition hover:border-[#FF6B24]/30 hover:bg-[#202020]"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Pending Count */}
      <div className="rounded-xl border border-white/[0.07] bg-[#181818] p-6">
        <p className="text-sm text-white/45">
          Pending requests
        </p>

        <p className="mt-2 text-3xl font-black text-[#FF6B24]">
          {pendingCount}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="rounded-xl border border-[#FF6B24]/20 bg-[#FF6B24]/10 p-4 text-sm text-[#FFB347]">
          {success}
        </div>
      )}

      {/* Empty State */}
      {requests.length === 0 ? (
        <div className="rounded-xl border border-white/[0.07] bg-[#181818] p-12 text-center">
          <UserRound
            size={36}
            className="mx-auto text-[#F2E8DC]/30"
          />

          <h2 className="mt-4 text-lg font-bold text-[#F2E8DC]">
            No profile requests
          </h2>

          <p className="mt-2 text-sm text-white/40">
            Member change requests will appear here.
          </p>
        </div>
      ) : (

        /* Request Cards */
        <div className="space-y-4">
          {requests.map((request) => {
            const isPending = request.status === 'pending'
            const isProcessing = processingId === request.id
            const member = request.profiles

            return (
              <div
                key={request.id}
                className="rounded-xl border border-white/[0.07] bg-[#181818] p-6 transition-all duration-200 hover:border-[#FF6B24]/20"
              >
                {/* Member Information */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#F2E8DC]">
                      {member?.full_name || 'Unknown member'}
                    </h2>

                    <p className="mt-1 text-sm text-white/40">
                      {member?.phone || 'No phone number'}
                    </p>

                    <p className="mt-2 text-xs text-white/30">
                      Submitted:{' '}
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                      request.status === 'pending'
                        ? 'border border-[#FFB347]/20 bg-[#FFB347]/10 text-[#FFB347]'
                        : request.status === 'approved'
                          ? 'border border-[#FF6B24]/20 bg-[#FF6B24]/10 text-[#FF9A55]'
                          : 'border border-red-500/20 bg-red-500/10 text-red-400'
                    }`}
                  >
                    {request.status}
                  </span>
                </div>

                {/* Requested Changes */}
                <div className="mt-6 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#FF8248]">
                    Requested changes
                  </p>

                  {Object.entries(
                    request.requested_changes || {},
                  ).map(([field, value]) => (
                    <div
                      key={field}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.04] bg-[#141414] px-4 py-3"
                    >
                      <span className="text-sm text-white/45">
                        {formatField(field)}
                      </span>

                      <span className="max-w-full break-all text-sm font-bold text-[#F2E8DC]">
                        {value || 'Not provided'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {isPending && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={() => handleReview(request.id, 'approve')}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] px-5 py-3 text-sm font-bold text-[#F2E8DC] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckCircle2 size={17} />
                      {isProcessing ? 'Processing...' : 'Approve'}
                    </button>

                    <button
                      onClick={() => handleReview(request.id, 'reject')}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-5 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <XCircle size={17} />
                      Reject
                    </button>
                  </div>
                )}

                {/* Review Timestamp */}
                {!isPending && request.reviewed_at && (
                  <p className="mt-5 text-xs text-white/30">
                    Reviewed:{' '}
                    {new Date(request.reviewed_at).toLocaleString()}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
    </div>
  )
}
