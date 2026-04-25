'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient }  from '@/lib/supabase/server'

export interface ImpactStats {
  totalDonated:        number
  charitiesSupported:  number
  activeSubscribers:   number
  drawsCompleted:      number
}

/**
 * Aggregates real-time impact data for the homepage hero.
 * Uses the admin client to read across all users without RLS filtering.
 */
export async function getImpactStats(): Promise<ImpactStats> {
  try {
    const admin = getSupabaseAdminClient()

    const [
      { count: activeCount },
      { count: charityCount },
      { count: drawCount },
    ] = await Promise.all([
      admin.from('users').select('*', { count: 'exact', head: true }).in('subscription_status', ['active', 'trialing']),
      admin.from('charities').select('*', { count: 'exact', head: true }),
      admin.from('draws').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    ])

    // Estimate donations: active subscribers × avg charity % × avg plan cost × months
    // This is a rough estimate; replace with a real ledger table for production
    const subscribers = activeCount ?? 0
    const avgMonthlyContribution = 0.10 * 9.99  // 10% of £9.99
    const estimatedMonths = Math.max(1, drawCount ?? 0)
    const totalDonated = parseFloat((subscribers * avgMonthlyContribution * estimatedMonths).toFixed(2))

    return {
      totalDonated,
      charitiesSupported:  charityCount ?? 0,
      activeSubscribers:   subscribers,
      drawsCompleted:      drawCount ?? 0,
    }
  } catch (err) {
    console.error('[getImpactStats]', err)
    return { totalDonated: 0, charitiesSupported: 0, activeSubscribers: 0, drawsCompleted: 0 }
  }
}
