/**
 * POST /api/admin/draw/run
 * Executes and persists the draw (status="closed"). Does NOT publish.
 * Admin must review results before calling /publish.
 * Admin-only.
 *
 * Body: { month: number, year: number, mode: 'random'|'algorithmic', strategy?: 'high-freq'|'low-freq' }
 */
import { NextRequest, NextResponse }  from 'next/server'
import { getSupabaseServerClient }    from '@/lib/supabase/server'
import { executeDraw }                from '@/lib/draw-service'
import type { DrawMode, AlgoStrategy } from '@/lib/draw-engine'

export async function POST(request: NextRequest) {
  try {
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

    const { drawId, simulation } = await executeDraw({ month, year, mode, strategy })

    return NextResponse.json({
      success:           true,
      drawId,
      month,
      year,
      mode,
      drawnNumbers:      simulation.drawnNumbers,
      activeSubscribers: simulation.activeSubscribers,
      tierCounts:        simulation.tierCounts,
      prizePool: {
        totalPool:       simulation.prizePool.totalPool,
        jackpotAlloc:    simulation.prizePool.jackpotAlloc,
        tier4Alloc:      simulation.prizePool.tier4Alloc,
        tier3Alloc:      simulation.prizePool.tier3Alloc,
        jackpotCarryOut: simulation.distribution.jackpotCarryOut,
      },
      message: `Draw saved with status "closed". Call /api/admin/draw/publish with drawId "${drawId}" to publish.`,
    })
  } catch (err: any) {
    console.error('[draw/run]', err)
    // Surface user-friendly duplicate-draw message
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
