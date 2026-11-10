import { ArrowUpRight } from 'lucide-react'

const trainers = [
  {
    number: '01',
    name: 'STRENGTH COACH',
    role: 'STRENGTH & MUSCLE DEVELOPMENT',
    description:
      'Build a stronger foundation through focused resistance training and consistent effort.',
    image: '/images/trainer-1.webp',
  },
  {
    number: '02',
    name: 'FITNESS COACH',
    role: 'PERSONAL FITNESS GUIDANCE',
    description:
      'Work towards your fitness goals with guidance that keeps your training purposeful.',
    image: '/images/trainer-2.webp',
  },
  {
    number: '03',
    name: 'CONDITIONING COACH',
    role: 'FITNESS & CONDITIONING',
    description:
      'Develop endurance, improve movement and bring more energy into every session.',
    image: '/images/trainer-3.webp',
  },
]

export default function Trainers() {
  return (
    <section
      id="trainers"
      className="bg-[#141414] px-5 py-24 sm:px-8 lg:px-14 lg:py-32"
    >
      <div className="mx-auto max-w-[1440px]">
        {/* Heading */}
        <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-[2px] w-10 bg-[#FF6B24]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#FFB347] sm:text-xs">
                Guidance that matters
              </p>
            </div>

            <h2 className="text-4xl font-black leading-[1.05] tracking-[-0.055em] text-[#F2E8DC] sm:text-5xl lg:text-7xl">
              MEET YOUR
              <span className="block bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] bg-clip-text text-transparent">
                TRAINING TEAM.
              </span>
            </h2>
          </div>

          <p className="max-w-sm text-sm leading-7 text-white/45">
            The right guidance can make every workout more meaningful.
            Find your focus, stay consistent and keep progressing.
          </p>
        </div>

        {/* Trainer cards */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trainers.map((trainer) => (
            <article key={trainer.number} className="group">
              <div className="relative aspect-[4/5] overflow-hidden bg-[#202020]">
                <img
                  src={trainer.image}
                  alt={trainer.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-top transition duration-700 ease-out group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/90 via-transparent to-black/10" />

                <span className="absolute left-5 top-5 text-xs font-bold tracking-[0.2em] text-white/65">
                  / {trainer.number}
                </span>

                <span className="absolute bottom-5 left-5 border border-white/20 bg-black/30 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#FFB347] backdrop-blur-sm">
                  PUMPING IRON
                </span>
              </div>

              <div className="border-b border-white/10 py-6">
                <p className="text-[9px] font-bold tracking-[0.18em] text-[#FF6B24]">
                  {trainer.role}
                </p>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-black tracking-tight text-[#F2E8DC]">
                    {trainer.name}
                  </h3>

                  <ArrowUpRight
                    size={19}
                    className="shrink-0 text-[#FF6B24] transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                  />
                </div>

                <p className="mt-3 text-sm leading-7 text-white/40">
                  {trainer.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-5 text-[10px] leading-5 text-white/30">
          Replace these illustrative portraits and role descriptions with
          verified trainer profiles before the official launch.
        </p>
      </div>
    </section>
  )
}