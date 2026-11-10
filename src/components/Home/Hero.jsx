
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowRight, Play } from 'lucide-react'
import { gsap } from 'gsap'

const slides = [
  {
    image: '/images/hero-1.webp',
    eyebrow: 'YOUR NEXT LEVEL STARTS HERE',
    title: 'BUILT BY',
    highlight: 'DISCIPLINE.',
    description:
      'A place to challenge your limits, build real strength and become better every single day.',
  },
  {
    image: '/images/hero-2.webp',
    eyebrow: 'TRAIN WITH PURPOSE',
    title: 'EARN YOUR',
    highlight: 'STRENGTH.',
    description:
      'Train with intent. Stay consistent. Make every rep count.',
  },
  {
    image: '/images/hero-3.webp',
    eyebrow: 'NO SHORTCUTS. NO EXCUSES.',
    title: 'MAKE YOUR',
    highlight: 'MOVE.',
    description:
      'Your goals deserve more than motivation. They deserve action.',
  },
]

export default function Hero() {
  const [activeSlide, setActiveSlide] = useState(0)

  const contentRef = useRef(null)
  const textAnimationRef = useRef(null)
  const isAnimatingRef = useRef(false)
  const activeSlideRef = useRef(0)

  const current = slides[activeSlide]

  function changeSlide(nextIndex) {
    if (
      nextIndex === activeSlideRef.current ||
      isAnimatingRef.current
    ) return

    isAnimatingRef.current = true

    const elements = contentRef.current?.querySelectorAll(
      '.hero-slide-content',
    )

    textAnimationRef.current?.kill()

    if (!elements?.length) {
      activeSlideRef.current = nextIndex
      setActiveSlide(nextIndex)
      return
    }

    textAnimationRef.current = gsap.to(elements, {
      y: -12,
      autoAlpha: 0,
      filter: 'blur(3px)',
      duration: 0.25,
      stagger: 0.04,
      ease: 'power2.in',
      onComplete: () => {
        activeSlideRef.current = nextIndex
        setActiveSlide(nextIndex)
      },
    })
  }

  useEffect(() => {
    const elements = contentRef.current?.querySelectorAll(
      '.hero-slide-content',
    )

    if (!elements?.length) return

    textAnimationRef.current = gsap.fromTo(
      elements,
      {
        y: 16,
        autoAlpha: 0,
        filter: 'blur(3px)',
      },
      {
        y: 0,
        autoAlpha: 1,
        filter: 'blur(0px)',
        duration: 0.6,
        stagger: 0.09,
        ease: 'power3.out',
        onComplete: () => {
          isAnimatingRef.current = false
        },
      },
    )

    return () => {
      textAnimationRef.current?.kill()
    }
  }, [activeSlide])

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (isAnimatingRef.current) return

      changeSlide((activeSlideRef.current + 1) % slides.length)
    }, 6500)

    return () => {
      window.clearInterval(interval)
      textAnimationRef.current?.kill()
    }
  }, [])

  return (
    <section className="relative isolate flex h-[calc(100svh-76px)] min-h-[620px] max-h-[920px] w-full items-center overflow-hidden bg-[#141414]">

      {/* Background fallback */}
      <div className="absolute inset-0 -z-10 bg-[#141414]" />

      {/* Fixed image frame */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {slides.map((slide, index) => (
          <img
            key={slide.image}
            src={slide.image}
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[1400ms] ease-in-out ${
              activeSlide === index ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
      </div>

      {/* Overlays */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#141414]/95 via-[#141414]/70 to-[#141414]/20" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-[#141414]/30" />
      <div className="pointer-events-none absolute inset-0 bg-black/15" />

      {/* Main content */}
      <div
        ref={contentRef}
        className="relative z-10 mx-auto w-full max-w-[1440px] px-5 py-10 sm:px-8 lg:px-14"
      >
        <div className="max-w-4xl">

          {/* Fixed eyebrow area */}
          <div className="hero-slide-content mb-6 flex min-h-[20px] items-center gap-3">
            <span className="h-[2px] w-10 shrink-0 bg-[#FF6B24]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#FFB347] sm:text-xs">
              {current.eyebrow}
            </p>
          </div>

          {/* Fixed heading area */}
          <div className="min-h-[clamp(105px,22vw,250px)] lg:min-h-[clamp(180px,25vw,300px)]">
            <h1 className="hero-slide-content text-[clamp(3.5rem,11vw,8.7rem)] font-black leading-[0.87] tracking-[-0.075em] text-[#F2E8DC]">
              {current.title}
              <span className="mt-2 block bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] bg-clip-text text-transparent">
                {current.highlight}
              </span>
            </h1>
          </div>

          {/* Fixed description area */}
          <div className="mt-5 min-h-[88px] max-w-xl sm:min-h-[64px]">
            <p className="hero-slide-content text-sm leading-7 text-[#F2E8DC]/65 sm:text-base sm:leading-8">
              {current.description}
            </p>
          </div>

          {/* Fixed CTA position */}
          <div className="hero-slide-content mt-7 flex min-h-14 flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/register"
              className="group inline-flex min-h-14 items-center justify-center gap-4 rounded-md bg-[#FF6B24] px-7 text-xs font-bold uppercase tracking-[0.13em] text-[#141414] shadow-xl shadow-[#FF6B24]/15 transition duration-300 hover:-translate-y-1 hover:bg-[#FFB347]"
            >
              Start your journey
              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>

            <a
              href="#about"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-md border border-white/20 bg-white/[0.04] px-7 text-xs font-bold uppercase tracking-[0.13em] text-[#F2E8DC] backdrop-blur-sm transition hover:border-[#FF6B24]/60 hover:bg-white/[0.08]"
            >
              <Play size={14} className="fill-current" />
              Explore the gym
            </a>
          </div>
        </div>

        {/* Bottom information */}
        <div className="mt-10 flex flex-col justify-between gap-7 border-t border-white/15 pt-6 sm:flex-row sm:items-end lg:mt-12">
          <div className="flex gap-8 sm:gap-16">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                Location
              </p>
              <p className="mt-2 text-sm font-bold text-[#F2E8DC]">
                Vodra, Rajshahi
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                Opening hours
              </p>
              <p className="mt-2 text-sm font-bold text-[#F2E8DC]">
                6:00 AM — 10:00 PM
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-8 sm:justify-end">
            <div className="flex items-center gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.image}
                  type="button"
                  onClick={() => changeSlide(index)}
                  aria-label={`Show slide ${index + 1}`}
                  aria-current={activeSlide === index ? 'true' : undefined}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    activeSlide === index
                      ? 'w-10 bg-[#FF6B24]'
                      : 'w-4 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>

            <a
              href="#about"
              className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45 transition hover:text-[#FFB347] sm:flex"
            >
              Scroll to explore
              <ArrowDown size={14} />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
