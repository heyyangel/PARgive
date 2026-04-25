import type { Metadata } from 'next'
import Link              from 'next/link'
import { redirect }      from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { stripe }        from '@/lib/stripe'

export const metadata: Metadata = {
  title: 'Subscription Confirmed — PARgive',
}

export default async function SubscribeSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const sessionId = searchParams.session_id
  let planName    = 'your plan'
  let amount      = ''

  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription'],
      })
      const planKey = session.metadata?.plan_key
      if (planKey === 'basic')   { planName = 'Monthly'; amount = '$9.99/month' }
      if (planKey === 'premium') { planName = 'Yearly';  amount = '$79.99/year' }
    } catch {
      // Non-critical — just show generic success
    }
  }

  return (
    <main className="min-h-screen bg-[#050508] flex items-center justify-center px-4">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 40%, rgba(16,185,129,0.12) 0%, transparent 65%)',
        }}
      />

      <div className="relative z-10 max-w-md w-full text-center">
        {/* Check icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">You're in! 🎉</h1>
        <p className="text-white/50 text-sm leading-relaxed mb-2">
          Your <span className="text-white font-medium">{planName}</span> subscription is now active.
          {amount && <> You'll be billed <span className="text-white font-medium">{amount}</span>.</>}
        </p>
        <p className="text-white/40 text-sm mb-10">
          You've been automatically entered into the upcoming monthly draw.
          Good luck! 🍀
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            id="go-to-dashboard"
            className="
              px-8 py-3 rounded-xl font-semibold text-sm text-white
              bg-gradient-to-r from-violet-600 to-indigo-600
              hover:from-violet-500 hover:to-indigo-500
              transition-all duration-200 shadow-lg shadow-violet-900/30
            "
          >
            Go to dashboard →
          </Link>
          <Link
            href="/account/settings"
            className="
              px-8 py-3 rounded-xl font-semibold text-sm text-white/70
              bg-white/5 border border-white/10
              hover:bg-white/10 hover:text-white
              transition-all duration-200
            "
          >
            Manage subscription
          </Link>
        </div>
      </div>
    </main>
  )
}
