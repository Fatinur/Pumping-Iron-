import { ArrowUpRight } from 'lucide-react'

const facilities = [
  {
    number: '01',
    title: 'FREE WEIGHTS',
    category: 'STRENGTH TRAINING',
    description:
      'Build strength through focused training with free-weight equipment.',
    image: '/images/facility-1.webp',
    className: 'lg:col-span-2',
  },
  {
    number: '02',
    title: 'STRENGTH MACHINES',
    category: 'CONTROLLED MOVEMENT',
    description:
      'Train specific muscle groups with controlled movements.',
    image: '/images/facility-2.webp',
    className: '',
  },
  {
    number: '03',
    title: 'CARDIO ZONE',
    category: 'ENDURANCE',
    description:
      'Keep moving and work towards better cardiovascular fitness.',
    image: '/images/facility-3.webp',
    className: '',
  },
  {
    number: '04',
    title: 'FUNCTIONAL TRAINING',
    category: 'PERFORMANCE',
    description:
      'Bring movement, coordination and conditioning into your routine.',
    image: '/images/facility-4.webp',
    className: '',
  },
  {
    number: '05',
    title: 'CHANGING FACILITIES',
    category: 'COMFORT',
    description:
      'A dedicated space to get ready before training and freshen up afterwards.',
    image: '/images/facility-5.webp',
    className: 'lg:col-span-2',
  },
]

export default function Facilities() {
  return (
    <section
      id="facilities"
      className="bg-[#101010] px-5 py-24 sm:px-8 lg:px-14 lg:py-32"
    >
      <div className="mx-auto max-w-[1440px]">
        {/* Section heading */}
        <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-[2px] w-10 bg-[#FF6B24]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#FFB347] sm:text-xs">
                The training environment
              </p>
            </div>

            <h2 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-[-0.055em] text-[#F2E8DC] sm:text-5xl lg:text-7xl">
              BUILT FOR
              <span className="block bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] bg-clip-text text-transparent">
                THE WORK.
              </span>
            </h2>
          </div>

          <p className="max-w-sm text-sm leading-7 text-white/45">
            Every part of your training experience should have a purpose.
            Explore the spaces designed to support your fitness journey.
          </p>
        </div>

        {/* Facility grid */}
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {facilities.map((facility) => (
            <article
              key={facility.number}
              className={`group relative min-h-[340px] overflow-hidden bg-[#202020] ${facility.className}`}
            >
              <img
                src={facility.image}
                alt={facility.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
              />

              {/* Image overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#101010] via-[#101010]/30 to-transparent" />
              <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/0" />

              {/* Number */}
              <span className="absolute left-6 top-6 text-xs font-bold tracking-[0.2em] text-white/65">
                / {facility.number}
              </span>

              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                <p className="mb-2 text-[9px] font-bold tracking-[0.2em] text-[#FFB347]">
                  {facility.category}
                </p>

                <h3 className="text-xl font-black tracking-tight text-[#F2E8DC] sm:text-2xl">
                  {facility.title}
                </h3>

                <p className="mt-3 max-w-sm text-xs leading-6 text-white/60">
                  {facility.description}
                </p>

                <div className="mt-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#FFB347]">
                  PUMPING IRON
                  <ArrowUpRight
                    size={14}
                    className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 text-[10px] leading-5 text-white/30">
          Facility imagery is illustrative. Confirm the actual equipment and
          facilities with the gym before publishing this as its official
          website.
        </p>
      </div>
    </section>
  )
}