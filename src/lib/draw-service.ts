/**
 * Draw Service — orchestrates DB + draw-engine + prize-calculator.
 * All functions use the Supabase admin client (service role).
 */
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import {
  generateRandomDraw, generateAlgorithmicDraw,
  matchAllEntrants, countTiers,
  type DrawMode, type AlgoStrategy, type MatchResult,
} from '@/lib/draw-engine'
import {
  calculatePrizePool, distributePrizes, buildWinnerAmounts,
  type PrizePoolBreakdown, type PrizeDistribution, type TierCounts,
} from '@/lib/prize-calculator'
import type { MatchTier } from '@/lib/supabase/types'
import { sendWinnerEmail, sendDrawResultsEmail } from '@/lib/email'

export interface DrawSimulationResult {
  drawnNumbers:      number[]
  mode:              DrawMode
  matchResults:      MatchResult[]
  tierCounts:        TierCounts
  prizePool:         PrizePoolBreakdown
  distribution:      PrizeDistribution
  activeSubscribers: number
}

// ─────────────────────────────────────────────────────────────
// SHARED: Load all subscriber scores (bulk, single query)
// ─────────────────────────────────────────────────────────────
async function loadSubscriberScores(admin: ReturnType<typeof getSupabaseAdminClient>) {
  const { data: users } = await admin
    .from('users')
    .select('id')
    .in('subscription_status', ['active', 'trialing'])

  const userIds = (users ?? []).map((u) => u.id)
  if (userIds.length === 0) return { userIds: [], scoresByUser: new Map<string, number[]>() }

  const { data: scores } = await admin
    .from('scores')
    .select('user_id, score_value')
    .in('user_id', userIds)

  const scoresByUser = new Map<string, number[]>()
  for (const s of scores ?? []) {
    const arr = scoresByUser.get(s.user_id) ?? []
    arr.push(s.score_value)
    scoresByUser.set(s.user_id, arr)
  }
  return { userIds, scoresByUser }
}

// ─────────────────────────────────────────────────────────────
// SHARED: Load monthly scores for algorithmic draw
// ─────────────────────────────────────────────────────────────
async function loadMonthlyScoreValues(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  month: number,
  year:  number
): Promise<number[]> {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const nextM = month === 12 ? 1  : month + 1
  const nextY = month === 12 ? year + 1 : year
  const end   = `${nextY}-${String(nextM).padStart(2, '0')}-01`

  const { data } = await admin
    .from('scores')
    .select('score_value')
    .gte('score_date', start)
    .lt('score_date',  end)

  return (data ?? []).map((s) => s.score_value)
}

// ─────────────────────────────────────────────────────────────
// SHARED: Resolve jackpot carry from the previous draw
// ─────────────────────────────────────────────────────────────
async function getPreviousJackpotCarry(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  month: number,
  year:  number
): Promise<number> {
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear  = month === 1 ? year - 1 : year

  const { data: prevDraw } = await admin
    .from('draws')
    .select('id')
    .eq('month',  prevMonth)
    .eq('year',   prevYear)
    .eq('status', 'published')
    .maybeSingle()

  if (!prevDraw) return 0

  const { data: prevPool } = await admin
    .from('prize_pools')
    .select('jackpot_carry')
    .eq('draw_id', prevDraw.id)
    .maybeSingle()

  return prevPool?.jackpot_carry ?? 0
}

// ─────────────────────────────────────────────────────────────
// SIMULATE — no DB writes
// ─────────────────────────────────────────────────────────────
export async function runDrawSimulation(opts: {
  month:    number
  year:     number
  mode:     DrawMode
  strategy?: AlgoStrategy
}): Promise<DrawSimulationResult> {
  const admin = getSupabaseAdminClient()
  const { month, year, mode, strategy = 'high-freq' } = opts

  // 1. Generate drawn numbers
  let drawnNumbers: number[]
  if (mode === 'algorithmic') {
    const monthly = await loadMonthlyScoreValues(admin, month, year)
    drawnNumbers  = generateAlgorithmicDraw(monthly, strategy)
  } else {
    drawnNumbers = generateRandomDraw()
  }

  // 2. Load all subscribers
  const { userIds, scoresByUser } = await loadSubscriberScores(admin)

  // 3. Match
  const matchResults = matchAllEntrants(scoresByUser, drawnNumbers)
  const tierCounts: TierCounts = {
    jackpot: matchResults.filter((r) => r.tier === 'jackpot').length,
    tier_4:  matchResults.filter((r) => r.tier === 'tier_4').length,
    tier_3:  matchResults.filter((r) => r.tier === 'tier_3').length,
  }

  // 4. Prize pool
  const jackpotCarryIn = await getPreviousJackpotCarry(admin, month, year)
  const prizePool      = calculatePrizePool(userIds.length, jackpotCarryIn)
  const distribution   = distributePrizes(prizePool, tierCounts)

  return { drawnNumbers, mode, matchResults, tierCounts, prizePool, distribution, activeSubscribers: userIds.length }
}

// ─────────────────────────────────────────────────────────────
// EXECUTE — persist draw + entries + prize pool (status=closed)
// ─────────────────────────────────────────────────────────────
export async function executeDraw(opts: {
  month:    number
  year:     number
  mode:     DrawMode
  strategy?: AlgoStrategy
}): Promise<{ drawId: string; simulation: DrawSimulationResult }> {
  const admin = getSupabaseAdminClient()

  // Guard: only one draw per month
  const { data: existing } = await admin
    .from('draws')
    .select('id, status')
    .eq('month', opts.month)
    .eq('year',  opts.year)
    .maybeSingle()

  if (existing && existing.status !== 'upcoming') {
    throw new Error(`Draw for ${opts.month}/${opts.year} already exists (status: ${existing.status}).`)
  }

  // Run simulation to get all computed values
  const simulation = await runDrawSimulation(opts)
  const { drawnNumbers, matchResults, prizePool, distribution } = simulation

  // ── Upsert draw record ──────────────────────────────────────
  let drawId: string
  if (existing) {
    await admin
      .from('draws')
      .update({ draw_numbers: drawnNumbers, status: 'closed' })
      .eq('id', existing.id)
    drawId = existing.id
  } else {
    const { data: newDraw, error } = await admin
      .from('draws')
      .insert({ month: opts.month, year: opts.year, draw_numbers: drawnNumbers, status: 'closed' })
      .select('id')
      .single()
    if (error || !newDraw) throw new Error(`Failed to create draw: ${error?.message}`)
    drawId = newDraw.id
  }

  // ── Upsert prize pool ───────────────────────────────────────
  await admin.from('prize_pools').upsert(
    {
      draw_id:       drawId,
      tier_3_amount: prizePool.tier3Alloc,
      tier_4_amount: prizePool.tier4Alloc,
      tier_5_amount: prizePool.jackpotAlloc,
      jackpot_carry: distribution.jackpotCarryOut,
    },
    { onConflict: 'draw_id' }
  )

  // ── Insert draw entries (only winners and 3+ match) ─────────
  const entryRows = matchResults
    .filter((r) => r.tier !== null)
    .map((r) => ({
      draw_id:         drawId,
      user_id:         r.userId,
      matched_numbers: r.matchedNumbers,
      match_tier:      r.tier as MatchTier,
    }))

  if (entryRows.length > 0) {
    await admin.from('draw_entries').upsert(entryRows, { onConflict: 'draw_id,user_id' })
  }

  return { drawId, simulation }
}

// ─────────────────────────────────────────────────────────────
// PUBLISH — finalise, create winners, update status
// ─────────────────────────────────────────────────────────────
export async function publishDraw(drawId: string): Promise<{
  winnersCreated: number
  totalPaidOut:   number
}> {
  const admin = getSupabaseAdminClient()

  // Validate draw is in 'closed' state
  const { data: draw, error: drawErr } = await admin
    .from('draws')
    .select('id, status, month, year')
    .eq('id', drawId)
    .single()

  if (drawErr || !draw) throw new Error('Draw not found.')
  if (draw.status === 'published') throw new Error('Draw is already published.')
  if (draw.status !== 'closed') throw new Error(`Draw must be in "closed" state to publish (current: ${draw.status}).`)

  // Load winning entries
  const { data: entries } = await admin
    .from('draw_entries')
    .select('id, user_id, match_tier')
    .eq('draw_id', drawId)

  // Load prize pool
  const { data: pool } = await admin
    .from('prize_pools')
    .select('*')
    .eq('draw_id', drawId)
    .single()

  if (!pool) throw new Error('Prize pool not found for this draw.')

  const tierCounts: TierCounts = {
    jackpot: (entries ?? []).filter((e) => e.match_tier === 'jackpot').length,
    tier_4:  (entries ?? []).filter((e) => e.match_tier === 'tier_4').length,
    tier_3:  (entries ?? []).filter((e) => e.match_tier === 'tier_3').length,
  }
  const poolBreakdown = {
    rawContributions: 0,
    jackpotCarryIn:   pool.jackpot_carry,
    totalPool:        pool.tier_3_amount + pool.tier_4_amount + pool.tier_5_amount,
    jackpotAlloc:     pool.tier_5_amount,
    tier4Alloc:       pool.tier_4_amount,
    tier3Alloc:       pool.tier_3_amount,
  }

  const dist        = distributePrizes(poolBreakdown, tierCounts)
  const amountMap   = buildWinnerAmounts(entries ?? [], dist)

  // Insert winners records
  const winnerRows = Array.from(amountMap.entries()).map(([userId, amount]) => {
    const entry = (entries ?? []).find((e) => e.user_id === userId)!
    return {
      draw_id:             drawId,
      user_id:             userId,
      tier:                entry.match_tier as MatchTier,
      amount,
      verification_status: 'pending' as const,
      payout_status:       'pending' as const,
    }
  })

  if (winnerRows.length > 0) {
    await admin.from('winners').upsert(winnerRows, { onConflict: 'draw_id,user_id' } as any)
  }

  // Update draw status → published
  await admin
    .from('draws')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', drawId)

  // Load draw numbers for email
  const { data: drawData } = await admin.from('draws').select('draw_numbers').eq('id', drawId).single()
  const drawnNumbers = (drawData?.draw_numbers ?? []) as number[]
  const monthName = new Date(draw.year, draw.month - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  // Send winner emails (fire-and-forget, don't block the response)
  for (const row of winnerRows) {
    try {
      const { data: u } = await admin.from('users').select('name, email').eq('id', row.user_id).single()
      if (u?.email) {
        await sendWinnerEmail(u.email, {
          name:   u.name ?? 'there',
          month:  monthName,
          tier:   row.tier,
          amount: row.amount,
        })
      }
    } catch (e) { console.error('[publishDraw] Winner email failed:', e) }
  }

  return { winnersCreated: winnerRows.length, totalPaidOut: dist.totalPaidOut }
}
