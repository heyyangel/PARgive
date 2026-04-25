'use client'

import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/Animate'

const STEPS = [
  {
    num:   '01',
    icon:  '💳',
    title: 'Subscribe',
    desc:  `Choose Monthly (£9.99) or Yearly (£79.99). Pick a charity. That's it — you're in.`,
    color: 'from-violet-500/20 to-violet-500/5',
  },
  {
    num:   '02',
    icon:  '📝',
    title: 'Enter your scores',
    desc:  'Submit up to 5 Stableford scores each month. They become your draw numbers.',
    color: 'from-sky-500/20 to-sky-500/5',
  },
  {
    num:   '03',
    icon:  '🎲',
    title: 'Monthly draw',
    desc:  'Five numbers are drawn. Match 3, 4, or all 5 of your scores to win from the prize pool.',
    color: 'from-amber-500/20 to-amber-500/5',
  },
  {
    num:   '04',
    icon:  '❤️',
    title: 'Support charity',
    desc:  'Win or lose, a percentage of every subscription goes directly to your chosen charity.',
    color: 'from-emerald-500/20 to-emerald-500/5',
  },
]

export default function HowItWorks() {
  return (
    <section className="relative z-10 max-w-5xl mx-auto px-5 py-20 sm:py-28">
      <FadeIn className="text-center mb-14">
        <p className="text-xs text-white/30 uppercase tracking-[0.2em] mb-3">How it works</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          Four steps. Real impact.
        </h2>
        <p className="text-white/40 text-sm mt-3 max-w-lg mx-auto">
          No complicated rules. Subscribe, play, and make a difference every month.
        </p>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" stagger={0.12}>
        {STEPS.map((step) => (
          <StaggerItem key={step.num}>
            <div className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-white/15 transition-all duration-300 group h-full">
              {/* Gradient accent */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${step.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{step.icon}</span>
                  <span className="text-4xl font-bold text-white/[0.06] leading-none">{step.num}</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  )
}
