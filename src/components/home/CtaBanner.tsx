'use client'

import Link from 'next/link'
import { FadeIn } from '@/components/motion/Animate'

export default function CtaBanner({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="relative z-10 text-center px-5 py-24 sm:py-32">
      <FadeIn>
        {/* Glow behind */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-violet-600/[0.08] rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <p className="text-emerald-400/70 text-sm font-medium mb-4">Ready to make a difference?</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
            Start playing.<br />Start giving.
          </h2>
          <p className="text-white/40 text-base sm:text-lg mb-10 max-w-md mx-auto">
            Join a community where every subscription supports charity and every score could be a winner.
          </p>
          <Link
            href={isLoggedIn ? '/subscribe' : '/signup'}
            id="footer-cta"
            className="
              relative inline-block px-10 py-4 rounded-2xl font-bold text-base text-white
              bg-gradient-to-r from-violet-600 to-indigo-600
              hover:from-violet-500 hover:to-indigo-500
              transition-all duration-300
              shadow-2xl shadow-violet-900/50 hover:shadow-violet-800/60
              hover:-translate-y-0.5
              group
            "
          >
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
            <span className="relative z-10">
              {isLoggedIn ? 'Choose a plan →' : 'Create your free account →'}
            </span>
          </Link>
        </div>
      </FadeIn>
    </section>
  )
}
