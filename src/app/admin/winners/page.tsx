'use client'

import { useState, useTransition } from 'react'
import { adminGetWinners, adminUpdateWinner } from '@/actions/admin'

type Winner = {
  id: string; tier: string; amount: number
  payout_status: string; verification_status: string; proof_url: string | null
  created_at: string
  user: { email: string; name: string | null } | null
  draw: { month: number; year: number } | null
}

const TIER_BADGE: Record<string, string> = {
  jackpot: 'bg-violet-500/15 border-violet-500/25 text-violet-300',
  tier_4:  'bg-emerald-500/15 border-emerald-500/25 text-emerald-300',
  tier_3:  'bg-sky-500/15 border-sky-500/25 text-sky-300',
}
const PAYOUT_BADGE: Record<string, string> = {
  pending:    'bg-amber-500/15 border-amber-500/25 text-amber-300',
  processing: 'bg-sky-500/15 border-sky-500/25 text-sky-300',
  paid:       'bg-emerald-500/15 border-emerald-500/25 text-emerald-300',
  failed:     'bg-red-500/15 border-red-500/25 text-red-300',
}
const VERIFY_BADGE: Record<string, string> = {
  pending:  'bg-amber-500/15 border-amber-500/25 text-amber-300',
  verified: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300',
  rejected: 'bg-red-500/15 border-red-500/25 text-red-300',
}

export default function AdminWinnersPage() {
  const [winners,    setWinners]    = useState<Winner[]>([])
  const [loaded,     setLoaded]     = useState(false)
  const [tierFilter,   setTierFilter]   = useState('')
  const [payoutFilter, setPayoutFilter] = useState('')
  const [isPending, startTransition] = useTransition()

  function reload(tier = tierFilter, payout = payoutFilter) {
    startTransition(async () => {
      const { data } = await adminGetWinners({
        tier:   tier   || undefined,
        payout: payout || undefined,
      })
      setWinners(data as Winner[])
      setLoaded(true)
    })
  }

  useState(() => { reload() })

  async function updateWinner(id: string, field: string, value: string) {
    const fd = new FormData()
    fd.set('id', id)
    fd.set(field, value)
    startTransition(async () => { await adminUpdateWinner(fd); reload() })
  }

  const totalPaid = winners.filter((w) => w.payout_status === 'paid').reduce((s, w) => s + w.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Winners</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {winners.length} records · £{totalPaid.toFixed(2)} paid out
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Tier', value: tierFilter, set: setTierFilter, opts: [['','All tiers'],['jackpot','Jackpot'],['tier_4','4 Match'],['tier_3','3 Match']] },
            { label: 'Payout', value: payoutFilter, set: setPayoutFilter, opts: [['','All payouts'],['pending','Pending'],['processing','Processing'],['paid','Paid'],['failed','Failed']] },
          ].map((f) => (
            <select key={f.label} value={f.value}
              onChange={(e) => { f.set(e.target.value); reload(f.label === 'Tier' ? e.target.value : tierFilter, f.label === 'Payout' ? e.target.value : payoutFilter) }}
              className="px-3 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:outline-none [color-scheme:dark]">
              {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          <button onClick={() => reload()} className="px-3 py-2 rounded-xl text-sm text-white/60 bg-white/5 border border-white/10 hover:text-white transition-all">
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-white/[0.02]">
              {['Draw', 'User', 'Tier', 'Amount', 'Verification', 'Payout', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loaded && <tr><td colSpan={7} className="text-center py-10 text-white/30">Loading…</td></tr>}
            {loaded && winners.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-white/30">No winners found</td></tr>}
            {winners.map((w) => {
              const draw = w.draw
              const drawStr = draw
                ? new Date(draw.year, draw.month - 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
                : '—'
              return (
                <tr key={w.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/60 whitespace-nowrap">{drawStr}</td>
                  <td className="px-4 py-3">
                    <p className="text-white/80 text-xs font-mono">{w.user?.email ?? '—'}</p>
                    <p className="text-white/30 text-xs">{w.user?.name ?? ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs border uppercase ${TIER_BADGE[w.tier] ?? ''}`}>
                      {w.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white font-semibold tabular-nums">£{w.amount?.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${VERIFY_BADGE[w.verification_status] ?? ''}`}>
                      {w.verification_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${PAYOUT_BADGE[w.payout_status] ?? ''}`}>
                      {w.payout_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {w.verification_status === 'pending' && <>
                        <button onClick={() => updateWinner(w.id, 'verification_status', 'verified')} disabled={isPending}
                          className="px-2 py-1 rounded-lg text-xs text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all">✓ Verify</button>
                        <button onClick={() => updateWinner(w.id, 'verification_status', 'rejected')} disabled={isPending}
                          className="px-2 py-1 rounded-lg text-xs text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-all">✕ Reject</button>
                      </>}
                      {w.payout_status === 'pending' && w.verification_status === 'verified' && (
                        <button onClick={() => updateWinner(w.id, 'payout_status', 'paid')} disabled={isPending}
                          className="px-2 py-1 rounded-lg text-xs text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 transition-all">Mark Paid</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
