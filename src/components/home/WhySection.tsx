'use client'

import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/Animate'

const REASONS = [
  {
    icon:  '🤝',
    title: 'Charity first, always',
    desc:  `We're not a lottery with a charity afterthought. Every subscriber chooses their charity and sets their contribution — minimum 10%, no maximum.`,
  },
  {
    icon:  '🔒',
    title: 'Transparent & verified',
    desc:  'Draw numbers are published monthly. Winners are verified. Payouts are tracked. No hidden algorithms, no house edge.',
  },
  {
    icon:  '📈',
    title: 'Your scores, your odds',
    desc:  'Unlike random number lotteries, your real Stableford scores become your entry. Play better golf, improve your chances.',
  },
  {
    icon:  '💰',
    title: 'Growing jackpots',
    desc:  'If no one matches all 5, the jackpot carries forward to next month. The prize pool grows with every subscriber who joins.',
  },
]

export default function WhySection() {
  return (
    <section className="relative z-10 max-w-5xl mx-auto px-5 py-20">
      <FadeIn className="text-center mb-14">
        <p className="text-xs text-white/30 uppercase tracking-[0.2em] mb-3">Why PARgive</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          Built different. For good.
        </h2>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-5" stagger={0.1}>
        {REASONS.map((r) => (
          <StaggerItem key={r.title}>
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-violet-500/20 hover:bg-violet-500/[0.03] transition-all duration-300 group h-full">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 origin-left">{r.icon}</div>
              <h3 className="text-base font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">{r.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{r.desc}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  )
}
