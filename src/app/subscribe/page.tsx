import type { Metadata } from 'next'
import { redirect }      from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { PLANS }         from '@/lib/stripe'
import PricingSection    from '@/components/subscribe/PricingSection'

export const metadata: Metadata = {
  title:       'Choose a Plan — PARgive',
  description: 'Subscribe to PARgive and enter monthly prize draws while supporting charity.',
}

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: { cancelled?: string }
}) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If already subscribed and active, redirect to dashboard
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_status, subscription_plan')
      .eq('id', user.id)
      .single()

    if (
      profile?.subscription_status === 'active' ||
      profile?.subscription_status === 'trialing'
    ) {
      redirect('/dashboard')
    }
  }

  return (
    <main className="min-h-screen bg-[#050508]">
      {/* Background glows */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(109,40,217,0.2) 0%, transparent 65%), ' +
            'radial-gradient(ellipse 40% 30% at 80% 80%, rgba(79,70,229,0.12) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-500/10 border border-violet-500/20 text-violet-300 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Monthly draw closes in 6 days
          </span>

          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            Play every month.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              Win prizes.
            </span>{' '}
            Fund charity.
          </h1>
          <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">
            One subscription. Monthly lottery draws. A percentage of every subscription
            goes directly to the charity you choose.
          </p>

          {searchParams.cancelled && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Checkout was cancelled. No charges were made.
            </div>
          )}
        </div>

        {/* Pricing cards */}
        <PricingSection plans={PLANS} isAuthenticated={!!user} />

        {/* Trust strip */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 text-center">
          {[
            { icon: '🔒', text: 'Secured by Stripe' },
            { icon: '↩️', text: 'Cancel anytime' },
            { icon: '💳', text: 'No hidden fees' },
            { icon: '🌍', text: 'Charity verified' },
          ].map((t) => (
            <div key={t.text} className="flex items-center gap-2 text-white/40 text-sm">
              <span>{t.icon}</span>
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
