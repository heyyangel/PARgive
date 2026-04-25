import { getSupabaseServerClient } from '@/lib/supabase/server'

export default async function WinningsOverview({ userId }: { userId: string }) {
  const supabase = await getSupabaseServerClient()

  // Fetch all wins for this user
  const { data: wins } = await supabase
    .from('winners')
    .select(`
      id, tier, amount, payout_status, verification_status, created_at,
      draw:draws(month, year)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  const allWins = wins ?? []
  const totalWon = allWins.reduce((sum, w) => sum + (w.amount ?? 0), 0)
  const totalPaid = allWins
    .filter((w) => w.payout_status === 'paid')
    .reduce((sum, w) => sum + (w.amount ?? 0), 0)

  const TIER_LABELS: Record<string, string> = {
    jackpot: '🏆 Jackpot',
    tier_4:  '4 Match',
    tier_3:  '3 Match',
  }
  const TIER_COLORS: Record<string, string> = {
    jackpot: 'bg-violet-500/15 border-violet-500/25 text-violet-300',
    tier_4:  'bg-emerald-500/15 border-emerald-500/25 text-emerald-300',
    tier_3:  'bg-sky-500/15 border-sky-500/25 text-sky-300',
  }
  const PAYOUT_COLORS: Record<string, string> = {
    pending:    'text-amber-400',
    processing: 'text-sky-400',
    paid:       'text-emerald-400',
    failed:     'text-red-400',
  }

  return (
    <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 space-y-5">
      <h2 className="text-sm font-semibold text-white">Winnings</h2>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
          <p className="text-xs text-white/40 mb-1">Total won</p>
          <p className="text-2xl font-bold text-white">
            £{totalWon.toFixed(2)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/8">
          <p className="text-xs text-white/40 mb-1">Paid out</p>
          <p className="text-2xl font-bold text-white">
            £{totalPaid.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Wins table */}
      {allWins.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-white/40">Win history</p>
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.02]">
                  {['Draw', 'Tier', 'Amount', 'Status'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-white/30 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allWins.map((w) => {
                  const draw = w.draw as any
                  const drawStr = draw
                    ? new Date(draw.year, draw.month - 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
                    : '—'
                  return (
                    <tr key={w.id} className="border-b border-white/5 last:border-0">
                      <td className="px-3 py-2.5 text-white/50">{drawStr}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] border ${TIER_COLORS[w.tier] ?? ''}`}>
                          {TIER_LABELS[w.tier] ?? w.tier}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-white font-semibold tabular-nums">
                        £{w.amount?.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`capitalize ${PAYOUT_COLORS[w.payout_status] ?? 'text-white/40'}`}>
                          {w.payout_status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-white/30 text-xs">No winnings yet</p>
          <p className="text-white/20 text-xs mt-1">Keep entering scores — your time will come!</p>
        </div>
      )}
    </div>
  )
}
