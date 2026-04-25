import Link                        from 'next/link'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import SubscriptionPanel           from '@/components/account/SubscriptionPanel'

const STATUS_CONFIG: Record<string, { label: string; dot: string; card: string }> = {
  active:    { label: 'Active',    dot: 'bg-emerald-400', card: 'border-emerald-500/20 bg-emerald-500/5' },
  trialing:  { label: 'Trial',     dot: 'bg-sky-400',     card: 'border-sky-500/20 bg-sky-500/5' },
  past_due:  { label: 'Past Due',  dot: 'bg-amber-400 animate-pulse', card: 'border-amber-500/20 bg-amber-500/5' },
  cancelled: { label: 'Cancelled', dot: 'bg-red-400',     card: 'border-red-500/20 bg-red-500/5' },
  inactive:  { label: 'Inactive',  dot: 'bg-white/30',    card: 'border-white/10 bg-white/[0.02]' },
}

const PLAN_LABELS: Record<string, string> = { free: 'Free', basic: 'Monthly', premium: 'Yearly' }

export default async function SubscriptionCard({ userId }: { userId: string }) {
  const supabase = await getSupabaseServerClient()

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase
      .from('users')
      .select('subscription_status, subscription_plan, subscription_start')
      .eq('id', userId)
      .single(),
    supabase
      .from('subscriptions')
      .select('plan, status, renewal_date, stripe_subscription_id')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const status  = profile?.subscription_status ?? 'inactive'
  const plan    = profile?.subscription_plan   ?? 'free'
  const cfg     = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive
  const renewal = sub?.renewal_date

  const renewalStr = renewal
    ? new Date(renewal).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  const startedStr = profile?.subscription_start
    ? new Date(profile.subscription_start).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : null

  return (
    <div className={`p-6 rounded-2xl border transition-all ${cfg.card}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          <p className="text-xs font-medium text-white/50 uppercase tracking-widest">
            Subscription
          </p>
        </div>
        <Link
          href="/account/settings"
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          Settings →
        </Link>
      </div>

      {/* Plan + status */}
      <div className="mb-5">
        <div className="flex items-end gap-3">
          <span className="text-3xl font-bold text-white">{PLAN_LABELS[plan]}</span>
          <span className={`mb-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border
            ${status === 'active'   ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300' : ''}
            ${status === 'trialing' ? 'bg-sky-500/15 border-sky-500/25 text-sky-300' : ''}
            ${status === 'past_due' ? 'bg-amber-500/15 border-amber-500/25 text-amber-300' : ''}
            ${status === 'cancelled'? 'bg-red-500/15 border-red-500/25 text-red-300' : ''}
            ${status === 'inactive' ? 'bg-white/10 border-white/10 text-white/40' : ''}
          `}>
            {cfg.label}
          </span>
        </div>

        <div className="mt-2 space-y-1">
          {renewalStr && (status === 'active' || status === 'trialing') && (
            <p className="text-white/40 text-sm">
              Renews <span className="text-white/60">{renewalStr}</span>
            </p>
          )}
          {renewalStr && status === 'cancelled' && (
            <p className="text-red-400/70 text-sm">Access ends {renewalStr}</p>
          )}
          {startedStr && (
            <p className="text-white/25 text-xs">Member since {startedStr}</p>
          )}
        </div>
      </div>

      {/* Past-due warning */}
      {status === 'past_due' && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          ⚠️ Your last payment failed. Update your billing details to avoid losing access.
        </div>
      )}

      {/* Action */}
      <SubscriptionPanel
        subscription={sub ? { plan: sub.plan, status: sub.status, renewal_date: sub.renewal_date } : null}
        hasStripeId={!!sub?.stripe_subscription_id}
      />
    </div>
  )
}
