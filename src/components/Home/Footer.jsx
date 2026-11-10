import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  MapPin,
  Clock3,
} from 'lucide-react'

const footerLinks = [
  { label: 'About', href: '#about' },
  { label: 'Facilities', href: '#facilities' },
  { label: 'Trainers', href: '#trainers' },
  { label: 'Membership', href: '#membership' },
  { label: 'Contact', href: '#contact' },
]

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#101010]">
      <div className="mx-auto max-w-[1440px] px-5 pb-8 pt-16 sm:px-8 lg:px-14 lg:pt-20">
        <div className="grid gap-12 border-b border-white/[0.08] pb-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex flex-col leading-[0.85]">
              <span className="text-[11px] font-black tracking-[0.29em] text-[#F2E8DC]">
                PUMPING
              </span>
              <span className="mt-1 bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] bg-clip-text text-[32px] font-black tracking-[0.12em] text-transparent">
                IRON
              </span>
            </Link>

            <p className="mt-6 max-w-sm text-sm leading-7 text-white/40">
              No Excuses. Just Progress. Build strength, develop discipline
              and keep moving towards a stronger you.
            </p>

            <div className="mt-6 flex gap-3">
              <a
                href="#contact"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-xs font-bold text-white/50 transition hover:border-[#FF6B24]/50 hover:text-[#FFB347]"
              >
                FB
              </a>

              <a
                href="#contact"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-xs font-bold text-white/50 transition hover:border-[#FF6B24]/50 hover:text-[#FFB347]"
              >
                IG
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#F2E8DC]">
              Explore
            </h3>

            <ul className="mt-6 space-y-4">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-[#FFB347]"
                  >
                    {link.label}
                    <ArrowUpRight
                      size={13}
                      className="opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#F2E8DC]">
              Visit us
            </h3>

            <div className="mt-6 space-y-5">
              <div className="flex items-start gap-3">
                <MapPin size={17} className="mt-0.5 shrink-0 text-[#FF6B24]" />
                <p className="text-sm leading-6 text-white/45">
                  Vodra, Rajshahi, Bangladesh
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Clock3 size={17} className="mt-0.5 shrink-0 text-[#FF6B24]" />
                <p className="text-sm leading-6 text-white/45">
                  Every day
                  <br />
                  6:00 AM – 10:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 pt-7 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="text-white/30">
            © {new Date().getFullYear()} PUMPING IRON. All rights reserved.
          </p>

          <p className="text-white/35">
            Designed & developed by{' '}
            <span className="font-bold text-[#F2E8DC]">
              Fatinur Islam Arnob
            </span>
          </p>
        </div>
      </div>
    </footer>
  )
}