
import { useEffect, useRef } from 'react'
import { ArrowUpRight, Dumbbell, Target, TrendingUp } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const values = [
  {
    icon: Dumbbell,
    title: 'TRAIN WITH PURPOSE',
    description:
      'Make every session count. Focus on proper movement, consistent effort and meaningful progress.',
  },
  {
    icon: Target,
    title: 'BUILD DISCIPLINE',
    description:
      'Real progress comes from showing up, staying committed and putting in the work.',
  },
  {
    icon: TrendingUp,
    title: 'BECOME STRONGER',
    description:
      'Set your goals, challenge your limits and keep moving towards a stronger version of yourself.',
  },
]

export default function About() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add(
        {
          desktop: '(min-width: 1024px)',
          mobile: '(max-width: 1023px)',
          reducedMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { desktop, reducedMotion } = context.conditions

          if (reducedMotion) {
            gsap.set(
              section.querySelectorAll('[data-about-reveal], [data-about-value]'),
              { clearProps: 'all' }
            )
            return
          }

          const distance = desktop ? 24 : 15
          const duration = desktop ? 0.75 : 0.55

          // Image reveal
          gsap.fromTo(
            '[data-about-image]',
            {
              autoAlpha: 0,
              y: distance,
              scale: 0.985,
            },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: duration + 0.15,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: section,
                start: desktop ? 'top 70%' : 'top 85%',
                once: true,
              },
            }
          )

          // Heading and supporting content
          gsap.fromTo(
            section.querySelectorAll('[data-about-reveal]'),
            {
              autoAlpha: 0,
              y: distance,
            },
            {
              autoAlpha: 1,
              y: 0,
              duration,
              stagger: desktop ? 0.12 : 0.08,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: '[data-about-content]',
                start: desktop ? 'top 75%' : 'top 85%',
                once: true,
              },
            }
          )

          // Three value cards: sequential entrance
          gsap.fromTo(
            section.querySelectorAll('[data-about-value]'),
            {
              autoAlpha: 0,
              y: desktop ? 32 : 20,
            },
            {
              autoAlpha: 1,
              y: 0,
              duration: desktop ? 0.7 : 0.5,
              stagger: desktop
                ? {
                    each: 0.17,
                    from: 'start',
                  }
                : {
                    each: 0.13,
                    from: 'start',
                  },
              ease: 'power2.out',
              scrollTrigger: {
                trigger: '[data-about-values]',
                start: desktop ? 'top 82%' : 'top 90%',
                once: true,
              },
            }
          )
        }
      )

      return () => mm.revert()
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#141414] px-5 py-24 sm:px-8 lg:py-16 lg:px-14"
    >
      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-16 lg:grid-cols-2 lg:gap-20 xl:gap-24">

        {/* Image */}
        <div
          data-about-image
          className="relative mx-auto w-full max-w-[480px]"
        >
          <div className="absolute -left-4 -top-4 h-32 w-32 border-l border-t border-[#FF6B24]/60" />

          <div className="relative aspect-[4/5] overflow-hidden rounded-sm lg:h-[min(68svh,620px)] lg:aspect-auto">
            <img
              src="/images/gym-about.webp"
              alt="Athlete taking a moment to recover after training"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/70 via-transparent to-transparent" />
          </div>

          <div className="absolute -bottom-6 -right-3 max-w-[230px] border border-white/10 bg-[#202020] p-5 sm:-right-6 sm:p-6">
            <p className="text-3xl font-black tracking-tight text-[#FF6B24]">
              01
            </p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F2E8DC]/60">
              One goal
            </p>
            <p className="mt-1 text-sm font-bold text-[#F2E8DC]">
              A stronger you.
            </p>
          </div>
        </div>

        {/* Content */}
        <div data-about-content>
          <div
            data-about-reveal
            className="mb-6 flex items-center gap-3"
          >
            <span className="h-[2px] w-10 bg-[#FF6B24]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#FFB347] sm:text-xs">
              More than a workout
            </p>
          </div>

          <h2
            data-about-reveal
            className="max-w-xl text-4xl font-black leading-[1.05] tracking-[-0.055em] text-[#F2E8DC] sm:text-5xl lg:text-6xl"
          >
            STRENGTH IS
            <span className="mt-2 block bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] bg-clip-text text-transparent">
              EARNED DAILY.
            </span>
          </h2>

          <p
            data-about-reveal
            className="mt-7 max-w-xl text-sm leading-8 text-[#F2E8DC]/55 sm:text-base"
          >
            PUMPING IRON is built around a simple idea: progress belongs to
            those who keep showing up. Whether you're starting your fitness
            journey or pushing towards your next goal, every session is an
            opportunity to get better.
          </p>

          <div
            data-about-values
            className="mt-10 space-y-7"
          >
            {values.map((item, index) => {
              const Icon = item.icon

              return (
                <div
                  key={item.title}
                  data-about-value
                  className="group flex gap-5 border-b border-white/[0.08] pb-7"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-[#FF6B24]/20 bg-[#FF6B24]/[0.07] text-[#FF6B24] transition duration-300 group-hover:border-[#FF6B24]/60 group-hover:bg-[#FF6B24]/15">
                    <Icon size={21} />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold tracking-[0.2em] text-[#FF6B24]">
                      0{index + 1}
                    </p>

                    <h3 className="mt-1 text-sm font-bold tracking-wide text-[#F2E8DC]">
                      {item.title}
                    </h3>

                    <p className="mt-2 max-w-lg text-sm leading-7 text-white/40">
                      {item.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <a
            data-about-reveal
            href="#membership"
            className="group mt-9 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.15em] text-[#F2E8DC] transition hover:text-[#FFB347]"
          >
            Find your membership
            <ArrowUpRight
              size={17}
              className="text-[#FF6B24] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
            />
          </a>
        </div>
      </div>
    </section>
  )
}
