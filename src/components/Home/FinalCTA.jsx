import { ArrowRight, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[#141414] px-5 py-24 sm:px-8 lg:px-14 lg:py-32">
      {/* Background */}
      <img
        src="/images/cta-background.webp"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div className="absolute inset-0 bg-[#141414]/75" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/95 via-[#141414]/65 to-[#141414]/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/80 via-transparent to-[#141414]/50" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-[1440px]">
        <div className="max-w-4xl">
          <div className="mb-7 flex items-center gap-3">
            <span className="h-[2px] w-10 bg-[#FF6B24]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#FFB347] sm:text-xs">
              Your time is now
            </p>
          </div>

          <h2 className="text-5xl font-black leading-[0.95] tracking-[-0.06em] text-[#F2E8DC] sm:text-7xl lg:text-[100px]">
            STOP
            <span className="block">WAITING.</span>
            <span className="block bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] bg-clip-text text-transparent">
              START BUILDING.
            </span>
          </h2>

          <p className="mt-8 max-w-xl text-sm leading-8 text-white/65 sm:text-base">
            You don't need the perfect moment to begin. Take the first step,
            commit to the process and build the stronger version of yourself.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/register"
              className="group inline-flex min-h-14 items-center justify-center gap-4 rounded-sm bg-[#FF6B24] px-7 text-xs font-bold uppercase tracking-[0.13em] text-[#141414] shadow-xl shadow-[#FF6B24]/20 transition duration-300 hover:-translate-y-1 hover:bg-[#FFB347]"
            >
              Join PUMPING IRON
              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>

            <a
              href="https://www.google.com/maps/search/?api=1&query=Vodra%2C+Rajshahi%2C+Bangladesh"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-14 items-center justify-center gap-3 border border-white/25 bg-white/[0.05] px-7 text-xs font-bold uppercase tracking-[0.13em] text-[#F2E8DC] backdrop-blur-sm transition hover:border-[#FF6B24]/60 hover:bg-white/[0.1]"
            >
              <MapPin size={16} className="text-[#FFB347]" />
              Find us in Rajshahi
            </a>
          </div>
        </div>

        <div className="mt-20 border-t border-white/20 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
            PUMPING IRON
          </p>
          <p className="mt-2 text-xs font-bold tracking-[0.15em] text-[#FFB347]">
            NO EXCUSES. JUST PROGRESS.
          </p>
        </div>
      </div>
    </section>
  )
}