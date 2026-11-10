import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

import Navbar from '../components/Home/Navbar'
import Hero from '../components/Home/Hero'
import About from '../components/Home/About'
import Facilities from '../components/Home/Facilities'
import Trainers from '../components/Home/Trainers'
import TrainerMessage from '../components/Home/TrainerMessage'
import Memberships from '../components/Home/Memberships'
import Location from '../components/Home/Location'
import FinalCTA from '../components/Home/FinalCTA'
import Footer from '../components/Home/Footer'

export default function Home() {
  const [plans, setPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [plansError, setPlansError] = useState('')

  const [settings, setSettings] = useState(null)
  const [settingsLoading, setSettingsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchHomepageData() {
      const [plansResult, settingsResult] = await Promise.all([
        supabase
          .from('membership_plans')
          .select('*')
          .eq('is_active', true)
          .order('duration_months', {
            ascending: true,
            nullsFirst: false,
          }),

        supabase
          .from('gym_settings')
          .select('phone, whatsapp')
          .eq('id', true)
          .single(),
      ])

      if (!isMounted) return

      if (plansResult.error) {
        console.error('Membership plans error:', plansResult.error)
        setPlansError('We could not load membership plans right now.')
      } else {
        setPlans(plansResult.data || [])
      }

      if (settingsResult.error) {
        console.error('Gym settings error:', settingsResult.error)
        setSettings(null)
      } else {
        setSettings(settingsResult.data)
      }

      setPlansLoading(false)
      setSettingsLoading(false)
    }

    fetchHomepageData()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <main className="min-h-screen overflow-hidden bg-[#141414] text-[#F2E8DC]">
      <Navbar />
      <Hero />

      <About />
      <Facilities />
      <Trainers />
      <TrainerMessage />

      <Memberships
        plans={plans}
        loading={plansLoading}
        error={plansError}
      />

      <Location
        settings={settings}
        loading={settingsLoading}
      />

      <FinalCTA />
      <Footer />
    </main>
  )
}