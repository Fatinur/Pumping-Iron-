import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Save } from 'lucide-react'

const phonePattern = /^[+\d\s-]{10,16}$/

export default function AdminSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [bkashNumber, setBkashNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  useEffect(() => {
    async function loadSettings() {
      const { data, error: loadError } = await supabase
        .from('gym_settings')
        .select('bkash_number, phone, whatsapp')
        .eq('id', true)
        .maybeSingle()

      if (loadError) {
        setError(loadError.message)
        setLoading(false)
        return
      }

      setBkashNumber(data?.bkash_number || '')
      setPhone(data?.phone || '')
      setWhatsapp(data?.whatsapp || '')
      setLoading(false)
    }

    loadSettings()
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const values = {
      bkash_number: bkashNumber.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
    }

    for (const [label, value] of [
      ['bKash number', values.bkash_number],
      ['Phone', values.phone],
      ['WhatsApp', values.whatsapp],
    ]) {
      if (value && !phonePattern.test(value)) {
        setError(`${label} doesn't look like a valid number.`)
        return
      }
    }

    setSaving(true)

    const { data, error: updateError } = await supabase
      .from('gym_settings')
      .update({
        bkash_number: values.bkash_number || null,
        phone: values.phone || null,
        whatsapp: values.whatsapp || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', true)
      .select('id')

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    if (!data || data.length === 0) {
      setError('Nothing was saved. The settings row could not be updated.')
      return
    }

    setSuccess('Settings saved.')
  }

  const inputClass =
    'w-full rounded-lg border border-white/[0.09] bg-[#202020] px-4 py-3 text-sm text-[#F2E8DC] placeholder:text-white/25 outline-none transition-all duration-200 focus:border-[#FF6B24]/70 focus:ring-2 focus:ring-[#FF6B24]/10'

  const labelClass = 'mb-2 block text-sm font-medium text-[#D8D0C7]'

  if (loading) {
    return (
      <div className="py-20 text-center text-[#F2E8DC]/50">
        Loading settings...
      </div>
    )
  }

  return (
    <div className="space-y-9">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF8248]">
          Administration
        </p>

        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Settings
        </h1>

        <p className="mt-3 text-sm text-white/45">
          Contact details and the number members send payments to.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="max-w-xl space-y-6 rounded-xl border border-white/[0.07] bg-[#181818] p-6"
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

        <div>
          <label className={labelClass}>bKash number</label>
          <input
            className={inputClass}
            type="text"
            value={bkashNumber}
            onChange={(e) => setBkashNumber(e.target.value)}
            placeholder="01XXXXXXXXX"
          />
          <p className="mt-2 text-xs text-white/35">
            Members will see this number when they pay by bKash.
          </p>
        </div>

        <div>
          <label className={labelClass}>Gym phone number</label>
          <input
            className={inputClass}
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
          />
        </div>

        <div>
          <label className={labelClass}>WhatsApp number</label>
          <input
            className={inputClass}
            type="text"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="8801XXXXXXXXX"
          />
          <p className="mt-2 text-xs text-white/35">
            Use the country code with no plus sign, so the WhatsApp link works.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] px-5 py-3 text-sm font-bold text-[#F2E8DC] transition duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-lg hover:shadow-[#FF6B24]/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={17} />
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </form>
    </div>
  )
}