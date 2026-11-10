
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, ArrowUpRight } from 'lucide-react'

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Facilities', href: '#facilities' },
  { label: 'Trainers', href: '#trainers' },
  { label: 'Membership', href: '#membership' },
  { label: 'Contact', href: '#contact' },
]

function Brand() {
  return (
    <Link
      to="/"
      aria-label="Pumping Iron homepage"
      className="inline-flex flex-col leading-[0.82]"
    >
      <span className="text-[10px] font-black tracking-[0.29em] text-[#F2E8DC]">
        PUMPING
      </span>
      <span className="mt-1 bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] bg-clip-text text-[22px] font-black tracking-[0.12em] text-transparent sm:text-[23px]">
        IRON
      </span>
    </Link>
  )
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="relative z-50 w-full border-b border-white/[0.08] bg-[#141414]/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:h-[72px] lg:px-14">
        <Brand />

        {/* Desktop navigation */}
        <div className="hidden items-center gap-7 lg:flex xl:gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/60 transition-colors duration-300 hover:text-[#FFB347]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-4 lg:flex">
          <Link
            to="/login"
            className="text-[11px] font-bold uppercase tracking-wider text-[#F2E8DC]/70 transition hover:text-white"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="group inline-flex items-center gap-2 rounded-md bg-[#FF6B24] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#141414] shadow-lg shadow-[#FF6B24]/10 transition duration-300 hover:-translate-y-0.5 hover:bg-[#FFB347]"
          >
            Join the gym
            <ArrowUpRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-[#F2E8DC] transition hover:border-[#FF6B24]/50 lg:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute inset-x-0 top-full border-b border-white/10 bg-[#181818] px-5 pb-6 pt-3 shadow-2xl lg:hidden">
          <div className="flex flex-col">
            {navLinks.map((link, index) => (
              <a
                key={link.label}
                href={link.href}
                onClick={closeMenu}
                className="flex items-center justify-between border-b border-white/[0.07] py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-white/70 transition hover:text-[#FFB347]"
              >
                <span>{link.label}</span>
                <span className="text-[10px] text-white/25">
                  0{index + 1}
                </span>
              </a>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              to="/login"
              onClick={closeMenu}
              className="rounded-md border border-white/15 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-[#F2E8DC]"
            >
              Login
            </Link>

            <Link
              to="/register"
              onClick={closeMenu}
              className="rounded-md bg-[#FF6B24] py-3 text-center text-[11px] font-bold uppercase tracking-wider text-[#141414]"
            >
              Join now
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
