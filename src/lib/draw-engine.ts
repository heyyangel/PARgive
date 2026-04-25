/**
 * Draw Engine — pure logic, no DB access.
 * Handles: random draw, algorithmic draw, entry matching.
 */

export type DrawMode     = 'random' | 'algorithmic'
export type AlgoStrategy = 'high-freq' | 'low-freq'

export interface MatchResult {
  userId:         string
  userScores:     number[]
  matchedNumbers: number[]
  matchCount:     number
  tier:           'jackpot' | 'tier_4' | 'tier_3' | null
}

const DRAW_SIZE = 5
const MIN_NUM   = 1
const MAX_NUM   = 45

// ─── Random Draw ─────────────────────────────────────────────
// Fisher-Yates shuffle on pool 1-45, take first 5 sorted.
export function generateRandomDraw(): number[] {
  const pool: number[] = Array.from({ length: MAX_NUM }, (_, i) => i + 1)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, DRAW_SIZE).sort((a, b) => a - b)
}

// ─── Algorithmic Draw ────────────────────────────────────────
// Builds a frequency-weighted probability map from this month's
// submitted scores, then samples DRAW_SIZE unique numbers.
// strategy='high-freq' → common scores more likely to be drawn.
// strategy='low-freq'  → rare scores more likely to be drawn.
export function generateAlgorithmicDraw(
  monthlyScoreValues: number[],
  strategy: AlgoStrategy = 'high-freq'
): number[] {
  // Base weight of 1 for every valid number
  const freqMap = new Map<number, number>()
  for (let n = MIN_NUM; n <= MAX_NUM; n++) freqMap.set(n, 1)

  // Boost by observed frequency
  for (const raw of monthlyScoreValues) {
    const v = Math.round(raw)
    if (v >= MIN_NUM && v <= MAX_NUM) {
      freqMap.set(v, (freqMap.get(v) ?? 1) + 2)
    }
  }

  // Invert weights for low-freq strategy
  if (strategy === 'low-freq') {
    const maxW = Math.max(...Array.from(freqMap.values()))
    for (const [n, w] of freqMap) freqMap.set(n, maxW - w + 1)
  }

  return weightedSampleWithoutReplacement(freqMap, DRAW_SIZE)
}

// Weighted sampling without replacement
function weightedSampleWithoutReplacement(
  weights: Map<number, number>,
  count:   number
): number[] {
  const pool    = new Map(weights)
  const results: number[] = []

  for (let i = 0; i < count && pool.size > 0; i++) {
    const total = Array.from(pool.values()).reduce((a, b) => a + b, 0)
    let rand = Math.random() * total
    for (const [num, w] of pool) {
      rand -= w
      if (rand <= 0) { results.push(num); pool.delete(num); break }
    }
  }
  return results.sort((a, b) => a - b)
}

// ─── Single-user Match Classifier ────────────────────────────
export function classifyMatch(
  userScores:   number[],
  drawnNumbers: number[]
): Pick<MatchResult, 'matchedNumbers' | 'matchCount' | 'tier'> {
  const drawn          = new Set(drawnNumbers)
  const matchedNumbers = userScores.map(Math.round).filter((s) => drawn.has(s))
  const matchCount     = matchedNumbers.length
  const tier: MatchResult['tier'] =
    matchCount >= 5 ? 'jackpot' :
    matchCount === 4 ? 'tier_4' :
    matchCount === 3 ? 'tier_3' : null
  return { matchedNumbers, matchCount, tier }
}

// ─── Bulk Match All Entrants ─────────────────────────────────
export function matchAllEntrants(
  scoresByUser: Map<string, number[]>,
  drawnNumbers: number[]
): MatchResult[] {
  const results: MatchResult[] = []
  for (const [userId, scores] of scoresByUser) {
    const { matchedNumbers, matchCount, tier } = classifyMatch(scores, drawnNumbers)
    results.push({ userId, userScores: scores, matchedNumbers, matchCount, tier })
  }
  return results
}

// ─── Tier Counter ────────────────────────────────────────────
export function countTiers(results: MatchResult[]) {
  return results.reduce(
    (acc, r) => {
      if (r.tier) acc[r.tier] = (acc[r.tier] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
}
