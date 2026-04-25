'use client'

import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/Animate'
import type { ImpactStats } from '@/actions/impact'

export default function ImpactStrip({ stats }: { stats: ImpactStats }) {
  const items = [
    {
      value:  stats.totalDonated > 0 ? `£${stats.totalDonated.toLocaleString()}` : '£0',
      label:  'Donated to charity',
      accent: 'text-emerald-400',
    },
    {
      value:  stats.charitiesSupported.toString(),
      label:  'Charities supported',
      accent: 'text-violet-400',
    },
    {
      value:  stats.activeSubscribers.toString(),
      label:  'Active members',
      accent: 'text-sky-400',
    },
    {
      value:  stats.drawsCompleted.toString(),
      label:  'Draws completed',
      accent: 'text-amber-400',
    },
  ]

  return (
    <section className="relative z-10 max-w-5xl mx-auto px-5 py-8">
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4" stagger={0.1}>
        {items.map((item) => (
          <StaggerItem key={item.label}>
            <div className="text-center p-5 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-white/15 transition-all duration-300">
              <p className={`text-3xl sm:text-4xl font-bold ${item.accent} mb-1`}>
                {item.value}
              </p>
              <p className="text-white/35 text-xs uppercase tracking-wider">{item.label}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  )
}
