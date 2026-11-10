import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await resetPassword(email)

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(true)
  }

  const inputClass =
    'w-full rounded-lg border border-white/[0.09] bg-[#202020] px-4 py-3 text-[#F2E8DC] placeholder:text-white/25 outline-none transition-all duration-200 focus:border-[#FF6B24]/70 focus:ring-2 focus:ring-[#FF6B24]/10'

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#141414] px-5 py-12 text-[#F2E8DC]">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-12 inline-flex flex-col leading-[0.85] transition-opacity hover:opacity-85"
        >
          <span className="text-2xl font-black tracking-[-0.07em] text-[#F2E8DC]">
            PUMPING
          </span>
          <span className="mt-1 bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] bg-clip-text text-2xl font-black tracking-[-0.07em] text-transparent">
            IRON.
          </span>
        </Link>

        {success ? (
          <div>
            <CheckCircle2 size={36} className="mb-6 text-[#FF6B24]" />

            <h1 className="text-3xl font-black tracking-tight">
              CHECK YOUR EMAIL
              <span className="text-[#FF6B24]">.</span>
            </h1>

            <p className="mt-4 text-sm leading-relaxed text-white/50">
              If an account exists for {email}, you'll receive a password
              reset link shortly. Check your inbox.
            </p>

            <Link
              to="/login"
              className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#FFB347] transition-colors hover:text-[#FF8248]"
            >
              <ArrowLeft size={16} />
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-black tracking-tight">
              FORGOT PASSWORD
              <span className="bg-gradient-to-r from-[#FFB347] to-[#D94A36] bg-clip-text text-transparent">
                .
              </span>
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-white/45">
              No worries. Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#D8D0C7]">
                  Email address
                </label>

                <input
                  className={inputClass}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/[0.07] p-3 text-sm text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] px-6 py-4 font-bold text-[#F2E8DC] tracking-wide  shadow-[0_4px_18px_rgba(255,107,36,0.13)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>{loading ? 'SENDING...' : 'SEND RESET LINK'}</span>
                {!loading && <ArrowRight size={19} />}
              </button>
            </form>

            <Link
              to="/login"
              className="mt-8 inline-flex items-center gap-2 text-sm text-white/45 transition-colors hover:text-[#F2E8DC]"
            >
              <ArrowLeft size={16} />
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </main>
  )
}