import {
  MapPin,
  Clock3,
  Phone,
  MessageCircle,
  ArrowUpRight,
} from 'lucide-react'

export default function Location({ settings, loading }) {
  const phone = settings?.phone?.trim() || ''
  const whatsapp = settings?.whatsapp?.replace(/\D/g, '') || ''

  const phoneLink = phone.replace(/[^\d+]/g, '')

  return (
    <section
      id="contact"
      className="bg-[#101010] px-5 py-24 sm:px-8 lg:px-14 lg:py-32"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-[2px] w-10 bg-[#FF6B24]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#FFB347] sm:text-xs">
                Find your way here
              </p>
            </div>

            <h2 className="text-4xl font-black leading-[1.05] tracking-[-0.055em] text-[#F2E8DC] sm:text-5xl lg:text-7xl">
              YOUR NEXT
              <span className="block bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] bg-clip-text text-transparent">
                SESSION AWAITS.
              </span>
            </h2>

            <p className="mt-7 max-w-lg text-sm leading-8 text-white/45 sm:text-base">
              Ready to get started? Visit PUMPING IRON, ask about membership
              options or get in touch with our team.
            </p>

            <div className="mt-10 space-y-7">
              <div className="flex gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#FF6B24]/20 bg-[#FF6B24]/[0.07] text-[#FF6B24]">
                  <MapPin size={20} />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                    Location
                  </p>
                  <p className="mt-2 text-base font-bold text-[#F2E8DC]">
                    Vodra, Rajshahi
                  </p>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Vodra%2C+Rajshahi%2C+Bangladesh"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[#FFB347] transition hover:text-[#FF6B24]"
                  >
                    Get directions <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#FF6B24]/20 bg-[#FF6B24]/[0.07] text-[#FF6B24]">
                  <Clock3 size={20} />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                    Opening hours
                  </p>
                  <p className="mt-2 text-base font-bold text-[#F2E8DC]">
                    Every day
                  </p>
                  <p className="mt-1 text-sm text-white/45">
                    6:00 AM – 10:00 PM
                  </p>
                </div>
              </div>

              {phone && (
                <div className="flex gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#FF6B24]/20 bg-[#FF6B24]/[0.07] text-[#FF6B24]">
                    <Phone size={20} />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                      Call us
                    </p>
                    <a
                      href={`tel:${phoneLink}`}
                      className="mt-2 inline-block text-base font-bold text-[#F2E8DC] transition hover:text-[#FFB347]"
                    >
                      {phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative flex min-h-[420px] flex-col justify-between overflow-hidden border border-white/10 bg-[#202020] p-7 sm:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_90%_0%,rgba(255,107,36,0.12),transparent_55%)]" />

            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFB347]">
                Take the first step
              </p>

              <h3 className="mt-5 max-w-md text-3xl font-black leading-tight tracking-tight text-[#F2E8DC] sm:text-4xl">
                HAVE QUESTIONS?
                <span className="mt-1 block text-[#FF6B24]">
                  LET'S TALK.
                </span>
              </h3>

              <p className="mt-5 max-w-sm text-sm leading-7 text-white/45">
                Ask us about membership plans, training options or anything
                else you need to know before your first visit.
              </p>
            </div>

            <div className="relative mt-12 space-y-3">
              {loading ? (
                <p className="text-sm text-white/40">
                  Loading contact details...
                </p>
              ) : (
                <>
                  {phone && (
                    <a
                      href={`tel:${phoneLink}`}
                      className="flex min-h-14 w-full items-center justify-between bg-[#FF6B24] px-5 text-xs font-bold uppercase tracking-[0.12em] text-[#141414] transition hover:bg-[#FFB347]"
                    >
                      Call PUMPING IRON
                      <Phone size={17} />
                    </a>
                  )}

                  {whatsapp && (
                    <a
                      href={`https://wa.me/${whatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-14 w-full items-center justify-between border border-white/15 bg-white/[0.03] px-5 text-xs font-bold uppercase tracking-[0.12em] text-[#F2E8DC] transition hover:border-[#FF6B24]/60 hover:bg-white/[0.06]"
                    >
                      Chat on WhatsApp
                      <MessageCircle size={17} className="text-[#FFB347]" />
                    </a>
                  )}

                  {!phone && !whatsapp && (
                    <p className="border border-white/10 px-5 py-4 text-sm leading-6 text-white/40">
                      Contact details are currently unavailable. Please visit
                      us in Vodra, Rajshahi.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}