'use client'

import Link  from 'next/link'
import Image from 'next/image'
import { FadeIn } from '@/components/motion/Animate'
import type { CharityRow } from '@/lib/supabase/types'

export default function CharitySpotlight({ charity }: { charity: CharityRow }) {
  return (
    <section className="relative z-10 max-w-5xl mx-auto px-5 py-16">
      <FadeIn>
        <div className="relative overflow-hidden rounded-3xl border border-violet-500/15">

          {/* Background image with heavy overlay */}
          {charity.image_url && (
            <div className="absolute inset-0">
              <Image
                src={charity.image_url}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#050508] via-[#050508]/90 to-[#050508]/60" />
            </div>
          )}

          {/* Fallback gradient if no image */}
          {!charity.image_url && (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 to-emerald-900/10" />
          )}

          {/* Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 p-8 sm:p-12 lg:p-16">
            <FadeIn delay={0.15} direction="none">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 mb-6">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Charity Spotlight
              </span>
            </FadeIn>

            <FadeIn delay={0.25}>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 max-w-lg leading-tight">
                {charity.name}
              </h2>
            </FadeIn>

            <FadeIn delay={0.35}>
              <p className="text-white/50 text-sm sm:text-base leading-relaxed max-w-xl mb-8">
                {charity.description ?? 'This charity is making a real difference in people\'s lives — and your subscription helps fund their work.'}
              </p>
            </FadeIn>

            <FadeIn delay={0.45}>
              <div className="flex flex-wrap gap-3">
                <Link href={`/charities/${charity.id}`}
                  className="px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 shadow-lg shadow-emerald-900/30">
                  Learn about their work →
                </Link>
                <Link href="/charities"
                  className="px-6 py-3 rounded-xl font-medium text-sm text-white/55 bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] hover:text-white transition-all duration-300">
                  Browse all charities
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </FadeIn>
    </section>
  )
}
