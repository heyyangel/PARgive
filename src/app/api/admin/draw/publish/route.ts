/**
 * POST /api/admin/draw/publish
 * Finalises a "closed" draw: creates winner records, updates status to "published".
 * Admin-only.
 *
 * Body: { drawId: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient }   from '@/lib/supabase/server'
import { publishDraw }               from '@/lib/draw-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body   = await request.json()
    const drawId = body.drawId as string | undefined

    if (!drawId) {
      return NextResponse.json({ error: 'drawId is required.' }, { status: 400 })
    }

    const { winnersCreated, totalPaidOut } = await publishDraw(drawId)

    return NextResponse.json({
      success:        true,
      drawId,
      winnersCreated,
      totalPaidOut,
      message:        `Draw published. ${winnersCreated} winner record(s) created. Total paid out: £${totalPaidOut.toFixed(2)}.`,
    })
  } catch (err: any) {
    console.error('[draw/publish]', err)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
