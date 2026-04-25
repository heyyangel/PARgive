/**
 * Prize Calculator — pure math, no DB access.
 * Handles: pool sizing, tier splits, per-winner distribution, jackpot carry.
 */

// £ contributed to the prize pool per active subscriber per draw
export const POOL_CONTRIBUTION_PER_SUBSCRIBER = 5.00

export const TIER_SPLITS = {
  jackpot: 0.40,  // 40% → 5-match
  tier_4:  0.35,  // 35% → 4-match
  tier_3:  0.25,  // 25% → 3-match
} as const

export interface PrizePoolBreakdown {
  rawContributions: number   // subscriberCount × contribution
  jackpotCarryIn:   number   // carried from previous draw
  totalPool:        number   // rawContributions + jackpotCarryIn
  jackpotAlloc:     number   // 40% of totalPool (= what 5-match winners share)
  tier4Alloc:       number   // 35%
  tier3Alloc:       number   // 25%
}

export interface TierCounts {
  jackpot: number
  tier_4:  number
  tier_3:  number
}

export interface PrizeDistribution {
  jackpotPerWinner:  number   // 0 if no winner
  tier4PerWinner:    number
  tier3PerWinner:    number
  jackpotCarryOut:   number   // amount rolling to next draw (0 if there's a winner)
  totalPaidOut:      number
}

// ─── Calculate pool sizes ─────────────────────────────────────
export function calculatePrizePool(
  activeSubscriberCount: number,
  jackpotCarryIn = 0
): PrizePoolBreakdown {
  const raw   = round2(activeSubscriberCount * POOL_CONTRIBUTION_PER_SUBSCRIBER)
  const total = round2(raw + jackpotCarryIn)
  return {
    rawContributions: raw,
    jackpotCarryIn,
    totalPool:    total,
    jackpotAlloc: round2(total * TIER_SPLITS.jackpot),
    tier4Alloc:   round2(total * TIER_SPLITS.tier_4),
    tier3Alloc:   round2(total * TIER_SPLITS.tier_3),
  }
}

// ─── Distribute prizes across winners ────────────────────────
// Jackpot: if no winner → carry full alloc to next draw.
// Tier 4 / 3: if no winner → pool is retained (not carried).
export function distributePrizes(
  pool:       PrizePoolBreakdown,
  tierCounts: TierCounts
): PrizeDistribution {
  const { jackpot: jCount, tier_4: t4Count, tier_3: t3Count } = tierCounts

  const jackpotPerWinner  = jCount  > 0 ? round2(pool.jackpotAlloc / jCount)  : 0
  const tier4PerWinner    = t4Count > 0 ? round2(pool.tier4Alloc   / t4Count) : 0
  const tier3PerWinner    = t3Count > 0 ? round2(pool.tier3Alloc   / t3Count) : 0
  const jackpotCarryOut   = jCount  === 0 ? pool.jackpotAlloc : 0
  const totalPaidOut = round2(
    jackpotPerWinner * jCount +
    tier4PerWinner   * t4Count +
    tier3PerWinner   * t3Count
  )

  return { jackpotPerWinner, tier4PerWinner, tier3PerWinner, jackpotCarryOut, totalPaidOut }
}

// ─── Build per-user prize map ─────────────────────────────────
export function buildWinnerAmounts(
  results:    { userId: string; tier: string | null }[],
  dist:       PrizeDistribution
): Map<string, number> {
  const map = new Map<string, number>()
  for (const r of results) {
    if (!r.tier) continue
    const amount =
      r.tier === 'jackpot' ? dist.jackpotPerWinner :
      r.tier === 'tier_4'  ? dist.tier4PerWinner :
      r.tier === 'tier_3'  ? dist.tier3PerWinner : 0
    if (amount > 0) map.set(r.userId, amount)
  }
  return map
}

function round2(n: number) {
  return parseFloat(n.toFixed(2))
}
