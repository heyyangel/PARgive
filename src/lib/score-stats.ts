/**
 * Pure utility — score statistics calculation.
 * Extracted from actions/scores.ts because 'use server' files
 * require all exports to be async server actions.
 */
import type { ScoreRow } from '@/lib/supabase/types'

export function computeScoreStats(scores: ScoreRow[]) {
  if (scores.length === 0) {
    return { average: null, best: null, worst: null, trend: null }
  }
  const values  = scores.map((s) => s.score_value)
  const average = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  const best    = Math.max(...values)
  const worst   = Math.min(...values)

  // Trend: compare most recent to previous (scores are date-desc ordered)
  let trend: 'up' | 'down' | 'same' | null = null
  if (scores.length >= 2) {
    const diff = scores[0].score_value - scores[1].score_value
    trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'
  }

  return { average, best, worst, trend }
}
