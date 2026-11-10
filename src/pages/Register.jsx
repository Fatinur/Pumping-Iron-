
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { signUp } = useAuth()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    height: '',
    weight: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (
      form.height && (Number(form.height) <= 0 || Number(form.height) > 300)
    ) {
      setError('Please enter a valid height in centimetres.')
      return
    }

    if (
      form.weight && (Number(form.weight) <= 0 || Number(form.weight) > 500)
    ) {
      setError('Please enter a valid weight in kilograms.')
      return
    }

    setLoading(true)

    const { error } = await signUp(form)

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(
      'Registration successful! Please check your email and verify your account before signing in.'
    )
  }

  const inputClass =
    'w-full rounded-lg border border-white/[0.09] bg-[#202020] px-4 py-3 text-[#F2E8DC] placeholder:text-white/25 outline-none transition-all duration-200 focus:border-[#FF6B24]/70 focus:ring-2 focus:ring-[#FF6B24]/10'

  const labelClass = 'mb-2 block text-sm font-medium text-[#D8D0C7]'

  return (
    <main className="min-h-screen bg-[#141414] px-5 py-12 text-[#F2E8DC]">
      <div className="mx-auto max-w-2xl">

        {/* BRAND WORDMARK */}
        <Link
          to="/"
          className="inline-flex flex-col leading-[0.85] transition-opacity duration-200 hover:opacity-85"
        >
          <span className="text-2xl font-black tracking-[-0.07em] text-[#F2E8DC]">
            PUMPING
          </span>

          <span className="mt-1 bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] bg-clip-text text-2xl font-black tracking-[-0.07em] text-transparent">
            IRON.
          </span>
        </Link>

        {/* PAGE INTRODUCTION */}
        <h1 className="mt-12 text-3xl font-black tracking-tight sm:text-4xl">
          CREATE YOUR ACCOUNT
          <span className="bg-gradient-to-r from-[#FFB347] to-[#D94A36] bg-clip-text text-transparent">
            .
          </span>
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-white/45 sm:text-base">
          Start building a stronger version of yourself.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">

            <div className="sm:col-span-2">
              <label className={labelClass}>Full name *</label>
              <input
                className={inputClass}
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                autoComplete="name"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className={labelClass}>Email *</label>
              <input
                className={inputClass}
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className={labelClass}>Phone number *</label>
              <input
                className={inputClass}
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                autoComplete="tel"
                placeholder="01XXXXXXXXX"
              />
            </div>

            <div>
              <label className={labelClass}>Date of birth</label>
              <input
                className={inputClass}
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className={labelClass}>Gender</label>
              <select
                className={inputClass}
                name="gender"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Height (cm)</label>
              <input
                className={inputClass}
                type="number"
                name="height"
                value={form.height}
                onChange={handleChange}
                min="1"
                max="300"
                placeholder="e.g. 175"
              />
            </div>

            <div>
              <label className={labelClass}>Weight (kg)</label>
              <input
                className={inputClass}
                type="number"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                min="1"
                max="500"
                step="0.1"
                placeholder="e.g. 70"
              />
            </div>

            <div>
              <label className={labelClass}>Password *</label>
              <input
                className={inputClass}
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label className={labelClass}>Confirm password *</label>
              <input
                className={inputClass}
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                placeholder="Enter password again"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/[0.07] p-3 text-sm text-red-400">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-lg border border-green-500/20 bg-green-500/[0.07] p-3 text-sm text-green-400">
              {success}
            </p>
          )}

          {/* PRIMARY ACTION */}
          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] px-6 py-4 font-black tracking-wide text-[#17120F] shadow-[0_4px_18px_rgba(255,107,36,0.13)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_7px_24px_rgba(255,107,36,0.2)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <span>
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </span>

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
          Already have an account?{' '}
          <Link
            to="/login"
            className="bg-gradient-to-r from-[#FFB347] to-[#D94A36] bg-clip-text font-bold text-transparent transition-opacity hover:opacity-80"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
