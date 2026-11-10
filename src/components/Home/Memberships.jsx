import { Check, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

function formatDuration(plan) {
  if (plan.is_lifetime) return 'Lifetime access'

  const months = Number(plan.duration_months)

  if (!months) return 'Membership plan'

  return `${months} ${months === 1 ? 'month' : 'months'}`
}

function formatPrice(price) {
  if (price === null || price === undefined || price === '') {
    return 'Contact us'
  }

  return `৳${Number(price).toLocaleString('en-BD')}`
}

export default function Memberships({ plans, loading, error }) {
  return (
    <section
      id="membership"
      className="bg-[#141414] px-5 py-24 sm:px-8 lg:px-14 lg:py-32"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="text-center">
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-[2px] w-10 bg-[#FF6B24]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#FFB347] sm:text-xs">
              Invest in yourself
            </p>
            <span className="h-[2px] w-10 bg-[#FF6B24]" />
          </div>

          <h2 className="text-4xl font-black leading-[1.05] tracking-[-0.055em] text-[#F2E8DC] sm:text-5xl lg:text-7xl">
            CHOOSE YOUR
            <span className="block bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] bg-clip-text text-transparent">
              COMMITMENT.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/45">
            Find a membership that fits your goals. Your next chapter starts
            with one decision.
          </p>
        </div>

        {loading && (
          <div className="flex min-h-64 items-center justify-center text-sm text-white/40">
            Loading membership plans...
          </div>
        )}

        {!loading && error && (
          <div className="mx-auto mt-14 max-w-xl border border-red-500/20 bg-red-500/[0.05] p-8 text-center">
            <p className="text-sm text-red-300">{error}</p>
            <p className="mt-3 text-xs text-white/40">
              Please contact the gym for current membership options.
            </p>
          </div>
        )}

        {!loading && !error && plans.length === 0 && (
          <div className="mt-14 border border-white/10 bg-[#202020] px-6 py-14 text-center">
            <h3 className="text-xl font-bold text-[#F2E8DC]">
              Membership plans coming soon
            </h3>
            <p className="mt-3 text-sm text-white/40">
              Contact us to learn about current membership options.
            </p>
          </div>
        )}

        {!loading && !error && plans.length > 0 && (
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, index) => {
              const hasDiscount =
                plan.discounted_price !== null &&
                plan.discounted_price !== undefined &&
                Number(plan.discounted_price) < Number(plan.regular_price)

              const currentPrice = hasDiscount
                ? plan.discounted_price
                : plan.regular_price

              const benefits = Array.isArray(plan.benefits)
                ? plan.benefits
                : []

              return (
                <article
                  key={plan.id}
                  className={`relative flex flex-col border p-7 transition duration-300 hover:-translate-y-1 sm:p-8 ${
                    index === 1
                      ? 'border-[#FF6B24]/60 bg-[#202020] shadow-xl shadow-[#FF6B24]/[0.07]'
                      : 'border-white/10 bg-[#191919] hover:border-[#FF6B24]/40'
                  }`}
                >
                  {index === 1 && (
                    <span className="absolute -top-px right-6 bg-[#FF6B24] px-4 py-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#141414]">
                      Popular choice
                    </span>
                  )}

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFB347]">
                      {formatDuration(plan)}
                    </p>

                    <h3 className="mt-3 text-2xl font-black text-[#F2E8DC]">
                      {plan.name}
                    </h3>

                    <div className="mt-7 flex flex-wrap items-baseline gap-3">
                      <span className="text-4xl font-black tracking-tight text-[#F2E8DC]">
                        {formatPrice(currentPrice)}
                      </span>

                      {hasDiscount && (
                        <span className="text-sm text-white/35 line-through">
                          {formatPrice(plan.regular_price)}
                        </span>
                      )}
                    </div>

                    {hasDiscount && (
                      <p className="mt-2 text-xs font-bold text-[#FFB347]">
                        Special offer available
                      </p>
                    )}
                  </div>

                  <div className="my-7 h-px bg-white/10" />

                  <div className="flex-1 space-y-4">
                    {benefits.map((benefit, benefitIndex) => (
                      <div
                        key={`${plan.id}-${benefitIndex}`}
                        className="flex items-start gap-3"
                      >
                        <Check
                          size={16}
                          className="mt-0.5 shrink-0 text-[#FF6B24]"
                        />
                        <p className="text-sm leading-6 text-white/55">
                          {benefit}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/register"
                    className="group mt-9 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-sm bg-[#FF6B24] px-5 text-xs font-bold uppercase tracking-[0.13em] text-[#141414] transition duration-300 hover:-translate-y-1 hover:bg-[#FFB347]"
                  >
                    Choose this plan
                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </article>
              )
            })}
          </div>
        )}

        <p className="mt-8 text-center text-[10px] leading-5 text-white/30">
          Membership terms and prices are managed by PUMPING IRON.
        </p>
      </div>
    </section>
  )
}