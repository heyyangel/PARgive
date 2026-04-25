import Image  from 'next/image'
import Link   from 'next/link'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { computeContributionAmount } from '@/lib/contribution'
import ContributionEditor           from '@/components/charities/ContributionEditor'

// Estimate total contributions since subscription_start
function estimateTotal(
  subscriptionStart: string | null,
  plan:              string,
  pct:               number
): number {
  if (!subscriptionStart) return 0
  const start   = new Date(subscriptionStart)
  const now     = new Date()
  const months  = Math.max(0,
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth())
  )
  const monthly = plan === 'premium' ? 79.99 / 12 : plan === 'basic' ? 9.99 : 0
  return parseFloat(((monthly * pct) / 100 * months).toFixed(2))
}

export default async function CharitySection({ userId }: { userId: string }) {
  const supabase = await getSupabaseServerClient()

  const { data: profile } = await supabase
    .from('users')
    .select('charity_id, charity_percentage, subscription_plan, subscription_start, subscription_status')
    .eq('id', userId)
    .single()

  const charityId  = profile?.charity_id
  const pct        = profile?.charity_percentage ?? 10
  const plan       = profile?.subscription_plan ?? 'free'
  const isActive   = ['active', 'trialing'].includes(profile?.subscription_status ?? '')

  let charity: { id: string; name: string; image_url: string | null } | null = null
  if (charityId) {
    const { data } = await supabase
      .from('charities')
      .select('id, name, image_url')
      .eq('id', charityId)
      .single()
    charity = data
  }

  const { amount, period } = computeContributionAmount(plan, pct)
  const totalContributed   = estimateTotal(profile?.subscription_start ?? null, plan, pct)

  return (
    <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-medium text-white/50 uppercase tracking-widest">My Charity</p>
        <Link href="/charities" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
          Change →
        </Link>
      </div>

      {charity ? (
        <>
          {/* Charity identity */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
              {charity.image_url ? (
                <Image src={charity.image_url} alt={charity.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-white">{charity.name}</p>
              <p className="text-white/40 text-xs mt-0.5">{pct}% of your subscription</p>
            </div>
          </div>

          {/* Contribution stats */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
              <p className="text-xs text-white/40 mb-1">Per {period}</p>
              <p className="text-xl font-bold text-white">£{amount.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-xl bg-violet-500/8 border border-violet-500/15">
              <p className="text-xs text-white/40 mb-1">Total contributed</p>
              <p className="text-xl font-bold text-white">£{totalContributed.toFixed(2)}</p>
            </div>
          </div>

          {/* Contribution editor (only if subscribed) */}
          {isActive && (
            <ContributionEditor
              currentPercentage={pct}
              plan={plan}
              charityName={charity.name}
            />
          )}
        </>
      ) : (
        /* No charity selected */
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="text-white/40 text-sm mb-4">No charity selected</p>
          <Link
            href="/charities"
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all"
          >
            Choose a charity
          </Link>
        </div>
      )}
    </div>
  )
}
