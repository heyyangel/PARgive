import type { Metadata } from 'next'
import Link              from 'next/link'
import Logo              from '@/components/layout/Logo'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getFeaturedCharity }      from '@/actions/charities'
import { getImpactStats }          from '@/actions/impact'
import HeroSection       from '@/components/home/HeroSection'
import ImpactStrip       from '@/components/home/ImpactStrip'
import HowItWorks        from '@/components/home/HowItWorks'
import WhySection        from '@/components/home/WhySection'
import CharitySpotlight  from '@/components/home/CharitySpotlight'
import CtaBanner         from '@/components/home/CtaBanner'

export const metadata: Metadata = {
  title:       'PARgive — Scores That Change Lives',
  description: 'Subscribe. Enter your scores. Win prizes. Every pound contributes to the charity you choose.',
}

export default async function HomePage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [featured, impact] = await Promise.all([
    getFeaturedCharity(),
    getImpactStats(),
  ])

  const isLoggedIn = !!user

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden">

      {/* Ambient gradients — fixed, no layout cost */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-violet-600/[0.12] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-emerald-500/[0.06] rounded-full blur-[100px]" />
      </div>

      {/* ── NAV ── */}
      <nav className="relative z-20 flex items-center justify-between px-5 sm:px-10 py-5 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Logo size="lg" />
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-white/45">
          <Link href="/charities" className="hover:text-white transition-colors">Charities</Link>
          <Link href="/subscribe" className="hover:text-white transition-colors">Pricing</Link>
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link href="/dashboard"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-900/30">
              Dashboard →
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block px-4 py-2 text-sm font-medium text-white/50 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link href="/signup"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-900/30">
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── SECTIONS ── */}
      <HeroSection isLoggedIn={isLoggedIn} />
      <ImpactStrip stats={impact} />
      <HowItWorks />
      <WhySection />
      {featured && <CharitySpotlight charity={featured} />}
      <CtaBanner isLoggedIn={isLoggedIn} />

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/8 px-6 py-8 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 text-white/20 text-xs">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
          </div>
          <div className="flex gap-6">
            {[
              { href: '/charities', label: 'Charities' },
              { href: '/subscribe', label: 'Pricing' },
              { href: '/login',     label: 'Sign in' },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white/50 transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
