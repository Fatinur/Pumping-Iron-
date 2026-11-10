
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate('/')
  }

  const inputClass =
    'w-full rounded-lg border border-white/[0.09] bg-[#202020] px-4 py-3 text-[#F2E8DC] placeholder:text-white/25 outline-none transition-all duration-200 focus:border-[#FF6B24]/70 focus:ring-2 focus:ring-[#FF6B24]/10'

  const labelClass = 'mb-2 block text-sm font-medium text-[#D8D0C7]'

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#141414] px-5 py-12 text-[#F2E8DC]">
      <div className="w-full max-w-md">

        {/* BRAND WORDMARK */}
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

        <h1 className="text-4xl font-black tracking-tight">
          WELCOME BACK
          <span className="bg-gradient-to-r from-[#FFB347] to-[#D94A36] bg-clip-text text-transparent">
            .
          </span>
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-white/45">
          Your next session starts here.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div>
            <label className={labelClass}>Email address</label>
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

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-[#D8D0C7]">
                Password
              </label>

              <Link
                to="/forgot-password"
                className="text-xs text-[#FFB347] transition-colors hover:text-[#FF8248]"
              >
                Forgot password?
              </Link>
            </div>

            <input
              className={inputClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
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
            className="group flex w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] px-6 py-4 font-black tracking-wide text-[#17120F] shadow-[0_4px_18px_rgba(255,107,36,0.13)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_7px_24px_rgba(255,107,36,0.2)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <span>{loading ? 'SIGNING IN...' : 'SIGN IN'}</span>

            {!loading && (
              <ArrowRight
                size={19}
                strokeWidth={2.3}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-white/45">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="bg-gradient-to-r from-[#FFB347] to-[#D94A36] bg-clip-text font-bold text-transparent"
          >
            Create account
          </Link>
        </p>
      </div>
    </main>
  )
}
