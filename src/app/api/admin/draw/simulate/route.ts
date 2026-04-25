/**
 * POST /api/admin/draw/simulate
 * Runs the draw engine without writing anything to the database.
 * Returns a full preview of: drawn numbers, tier counts, prize pools, per-winner amounts.
 * Admin-only.
 *
 * Body: { month: number, year: number, mode: 'random'|'algorithmic', strategy?: 'high-freq'|'low-freq' }
 */
import { NextRequest, NextResponse }  from 'next/server'
import { getSupabaseServerClient }    from '@/lib/supabase/server'
import { runDrawSimulation }          from '@/lib/draw-service'
import type { DrawMode, AlgoStrategy } from '@/lib/draw-engine'

export async function POST(request: NextRequest) {
  try {
    // ── Admin guard ──────────────────────────────────────────
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body     = await request.json()
    const month    = Number(body.month)
    const year     = Number(body.year)
    const mode     = (body.mode     ?? 'random')    as DrawMode
    const strategy = (body.strategy ?? 'high-freq') as AlgoStrategy

    if (!month || !year || month < 1 || month > 12 || year < 2024) {
      return NextResponse.json({ error: 'Invalid month or year.' }, { status: 400 })
    }
    if (!['random', 'algorithmic'].includes(mode)) {
      return NextResponse.json({ error: 'mode must be "random" or "algorithmic".' }, { status: 400 })
    }

    const result = await runDrawSimulation({ month, year, mode, strategy })

    // Shape the response for easy consumption
    return NextResponse.json({
      simulation: true,
      month,
      year,
      mode,
      strategy:          mode === 'algorithmic' ? strategy : null,
      drawnNumbers:      result.drawnNumbers,
      activeSubscribers: result.activeSubscribers,
      tierCounts:        result.tierCounts,
      prizePool: {
        totalPool:    result.prizePool.totalPool,
        jackpotAlloc: result.prizePool.jackpotAlloc,
        tier4Alloc:   result.prizePool.tier4Alloc,
        tier3Alloc:   result.prizePool.tier3Alloc,
        carryIn:      result.prizePool.jackpotCarryIn,
      },
      distribution: {
        jackpotPerWinner:  result.distribution.jackpotPerWinner,
        tier4PerWinner:    result.distribution.tier4PerWinner,
        tier3PerWinner:    result.distribution.tier3PerWinner,
        jackpotCarryOut:   result.distribution.jackpotCarryOut,
        totalPaidOut:      result.distribution.totalPaidOut,
      },
      // Preview of winners (userId + tier only, no PII)
      winnerPreview: result.matchResults
        .filter((r) => r.tier !== null)
        .map((r) => ({ userId: r.userId, tier: r.tier, matchCount: r.matchCount })),
    })
  } catch (err: any) {
    console.error('[draw/simulate]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
