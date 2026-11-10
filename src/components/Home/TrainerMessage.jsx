import { ArrowDownRight } from 'lucide-react'

export default function TrainerMessage() {
  return (
    <section className="relative overflow-hidden bg-[#101010] px-5 py-24 sm:px-8 lg:px-14 lg:py-32">
      <div className="mx-auto grid max-w-[1440px] items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        {/* Image */}
        <div className="relative order-2 lg:order-1">
          <div className="absolute -left-3 -top-3 h-28 w-28 border-l border-t border-[#FF6B24]/60" />

          <div className="relative aspect-[5/4] overflow-hidden bg-[#202020]">
            <img
              src="/images/trainer-coaching.webp"
              alt="A coach guiding a member during training"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
          </div>

          <div className="absolute -bottom-5 right-5 bg-[#FF6B24] px-5 py-4 sm:right-8 sm:px-7">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#141414]/70">
              Our philosophy
            </p>
            <p className="mt-1 text-lg font-black tracking-tight text-[#141414]">
              Progress over perfection.
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="order-1 lg:order-2">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-[2px] w-10 bg-[#FF6B24]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#FFB347] sm:text-xs">
              A message from our team
            </p>
          </div>

          <h2 className="text-4xl font-black leading-[1.05] tracking-[-0.055em] text-[#F2E8DC] sm:text-5xl lg:text-6xl">
            EVERY REP
            <span className="block bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] bg-clip-text text-transparent">
              HAS A PURPOSE.
            </span>
          </h2>

          <div className="mt-8 border-l-2 border-[#FF6B24] pl-6">
            <p className="text-base leading-8 text-[#F2E8DC]/75 sm:text-lg">
              Fitness isn't about becoming someone else overnight. It's about
              building better habits, respecting your own pace and showing up
              even when motivation fades.
            </p>

            <p className="mt-5 text-sm leading-7 text-white/40">
              Start where you are. Train with purpose. Give yourself the time
              and consistency that real progress demands.
            </p>
          </div>

          <a
            href="#membership"
            className="group mt-9 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.15em] text-[#F2E8DC] transition hover:text-[#FFB347]"
          >
            Start your journey
            <ArrowDownRight
              size={18}
              className="text-[#FF6B24] transition-transform group-hover:translate-x-1 group-hover:translate-y-1"
            />
          </a>

          <p className="mt-10 text-[9px] font-bold uppercase tracking-[0.2em] text-white/25">
            PUMPING IRON — No Excuses. Just Progress.
          </p>
        </div>
      </div>
    </section>
  )
}