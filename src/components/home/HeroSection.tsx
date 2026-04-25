'use client'

import Link from 'next/link'
import { FadeIn } from '@/components/motion/Animate'

export default function HeroSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="relative z-10 text-center px-5 pt-20 sm:pt-28 pb-16 max-w-4xl mx-auto">

      {/* Pill */}
      <FadeIn delay={0.1}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Every subscription supports a charity you choose
        </div>
      </FadeIn>

      {/* Headline */}
      <FadeIn delay={0.2}>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
          Your scores don't just{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-violet-400 bg-clip-text text-transparent">
            win prizes
          </span>
          <br />
          <span className="text-white/90">they change lives</span>
        </h1>
      </FadeIn>

      {/* Subline */}
      <FadeIn delay={0.35}>
        <p className="text-white/45 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
          Subscribe. Enter your Stableford scores. Get entered into monthly draws.
          Win real prizes — and know that a part of every pound goes directly to the charity <em>you</em> pick.
        </p>
      </FadeIn>

      {/* CTA cluster */}
      <FadeIn delay={0.5}>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={isLoggedIn ? '/dashboard' : '/subscribe'}
            id="hero-cta"
            className="
              relative px-8 py-4 rounded-2xl font-bold text-base text-white
              bg-gradient-to-r from-violet-600 to-indigo-600
              hover:from-violet-500 hover:to-indigo-500
              transition-all duration-300
              shadow-2xl shadow-violet-900/50 hover:shadow-violet-800/60
              hover:-translate-y-0.5
              group
            "
          >
            {/* Glow ring */}
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
            <span className="relative z-10">
              {isLoggedIn ? 'Go to dashboard →' : 'Subscribe from £9.99/mo →'}
            </span>
          </Link>

          <Link
            href="/charities"
            className="px-8 py-4 rounded-2xl font-semibold text-base text-white/60 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:text-white transition-all duration-300"
          >
            See our charities
          </Link>
        </div>
      </FadeIn>

      {/* Trust signals */}
      <FadeIn delay={0.65}>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-12 text-white/20 text-xs">
          {[
            'Cancel anytime',
            'Min 10% to charity',
            'Monthly prize draws',
            'Verified payouts',
          ].map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t}
            </div>
          ))}
        </div>
      </FadeIn>
    </section>
  )
}
