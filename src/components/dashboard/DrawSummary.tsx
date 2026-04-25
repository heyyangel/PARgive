import Link from 'next/link'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export default async function DrawSummary({ userId }: { userId: string }) {
  const supabase = await getSupabaseServerClient()
  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  // Current month draw
  const { data: currentDraw } = await supabase
    .from('draws')
    .select('id, status, draw_numbers, month, year')
    .eq('month', month)
    .eq('year', year)
    .maybeSingle()

  // User's entry for the current draw
  let currentEntry = null
  if (currentDraw) {
    const { data } = await supabase
      .from('draw_entries')
      .select('matched_numbers, match_tier')
      .eq('draw_id', currentDraw.id)
      .eq('user_id', userId)
      .maybeSingle()
    currentEntry = data
  }

  // Past draws (last 6)
  const { data: pastDraws } = await supabase
    .from('draws')
    .select('id, month, year, status, draw_numbers')
    .eq('status', 'published')
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(6)

  // Next draw date (1st of next month)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear  = month === 12 ? year + 1 : year
  const nextDrawDate = new Date(nextYear, nextMonth - 1, 1)
  const daysUntil = Math.max(0, Math.ceil((nextDrawDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  const TIER_LABELS: Record<string, string> = {
    jackpot: '🏆 Jackpot (5)',
    tier_4:  '4 matches',
    tier_3:  '3 matches',
  }

  return (
    <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Draw Participation</h2>
        <span className="text-xs text-white/30">
          {now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Next draw countdown */}
      <div className="p-4 rounded-xl bg-violet-500/8 border border-violet-500/15">
        <p className="text-xs text-white/40 mb-1">Next draw</p>
        <p className="text-2xl font-bold text-white">
          {daysUntil} <span className="text-sm font-normal text-white/40">days away</span>
        </p>
        <p className="text-xs text-white/30 mt-1">
          {nextDrawDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* This month's status */}
      {currentDraw && (
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/8">
          <p className="text-xs text-white/40 mb-2">This month&apos;s draw</p>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs border capitalize ${
              currentDraw.status === 'published'
                ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300'
                : 'bg-amber-500/15 border-amber-500/25 text-amber-300'
            }`}>
              {currentDraw.status}
            </span>
          </div>
          {currentDraw.status === 'published' && currentDraw.draw_numbers && (
            <div className="flex gap-2 mt-2">
              {(currentDraw.draw_numbers as number[]).map((n) => (
                <div key={n} className="w-8 h-8 rounded-full bg-violet-600/25 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-white">
                  {n}
                </div>
              ))}
            </div>
          )}
          {currentEntry && (
            <p className="text-xs text-emerald-400 mt-3">
              ✓ {TIER_LABELS[currentEntry.match_tier] ?? `${currentEntry.matched_numbers?.length ?? 0} matches`}
            </p>
          )}
          {!currentEntry && currentDraw.status === 'published' && (
            <p className="text-xs text-white/30 mt-2">No matches this month</p>
          )}
        </div>
      )}

      {/* Past draws */}
      {(pastDraws ?? []).length > 0 && (
        <div>
          <p className="text-xs text-white/40 mb-2">Draw history</p>
          <div className="space-y-1.5">
            {(pastDraws ?? []).slice(0, 5).map((draw) => {
              const monthName = new Date(draw.year, draw.month - 1).toLocaleDateString('en-GB', { month: 'short' })
              return (
                <div key={draw.id} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-white/50">{monthName} {draw.year}</span>
                  <div className="flex gap-1.5">
                    {(draw.draw_numbers as number[])?.map((n) => (
                      <span key={n} className="w-5 h-5 rounded-full bg-white/8 flex items-center justify-center text-[10px] text-white/40">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {(pastDraws ?? []).length === 0 && !currentDraw && (
        <p className="text-white/30 text-xs text-center py-4">No draws yet — the first draw will happen at month end.</p>
      )}
    </div>
  )
}
