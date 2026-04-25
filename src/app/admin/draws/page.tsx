'use client'

import { useState, useTransition } from 'react'
import { getAdmin } from '@/lib/admin-guard'

type DrawMode     = 'random' | 'algorithmic'
type AlgoStrategy = 'high-freq' | 'low-freq'
type DrawStatus   = 'upcoming' | 'open' | 'closed' | 'published'

interface SimResult {
  drawnNumbers: number[]
  tierCounts:   { jackpot: number; tier_4: number; tier_3: number }
  prizePool:    { totalPool: number; jackpotAlloc: number; tier4Alloc: number; tier3Alloc: number }
  distribution: { jackpotPerWinner: number; tier4PerWinner: number; tier3PerWinner: number; jackpotCarryOut: number }
  activeSubscribers: number
}

const STATUS_BADGE: Record<DrawStatus | string, string> = {
  upcoming:  'bg-white/8 border-white/10 text-white/40',
  open:      'bg-sky-500/15 border-sky-500/25 text-sky-300',
  closed:    'bg-amber-500/15 border-amber-500/25 text-amber-300',
  published: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300',
}

export default function AdminDrawsPage() {
  const now   = new Date()
  const [month,    setMonth]    = useState(now.getMonth() + 1)
  const [year,     setYear]     = useState(now.getFullYear())
  const [mode,     setMode]     = useState<DrawMode>('random')
  const [strategy, setStrategy] = useState<AlgoStrategy>('high-freq')
  const [simResult, setSimResult] = useState<SimResult | null>(null)
  const [runDrawId, setRunDrawId] = useState<string | null>(null)
  const [msg,  setMsg]  = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [step, setStep] = useState<'idle' | 'simulated' | 'ran'>('idle')
  const [isPending, startTransition] = useTransition()

  async function handleSimulate() {
    setMsg(null)
    startTransition(async () => {
      const res = await fetch('/api/admin/draw/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year, mode, strategy }),
      })
      const data = await res.json()
      if (data.error) { setMsg({ type: 'err', text: data.error }); return }
      setSimResult(data)
      setStep('simulated')
    })
  }

  async function handleRun() {
    setMsg(null)
    startTransition(async () => {
      const res = await fetch('/api/admin/draw/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year, mode, strategy }),
      })
      const data = await res.json()
      if (data.error) { setMsg({ type: 'err', text: data.error }); return }
      setRunDrawId(data.drawId)
      setStep('ran')
      setMsg({ type: 'ok', text: `Draw saved (ID: ${data.drawId}). Review then publish.` })
    })
  }

  async function handlePublish() {
    if (!runDrawId) return
    setMsg(null)
    startTransition(async () => {
      const res = await fetch('/api/admin/draw/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawId: runDrawId }),
      })
      const data = await res.json()
      if (data.error) { setMsg({ type: 'err', text: data.error }); return }
      setMsg({ type: 'ok', text: `Published! ${data.winnersCreated} winners · £${data.totalPaidOut} paid out.` })
      setStep('idle')
      setSimResult(null)
      setRunDrawId(null)
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Draw Management</h1>
        <p className="text-white/40 text-sm mt-0.5">Run, simulate, and publish monthly draws</p>
      </div>

      {/* ── Draw controls ── */}
      <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 space-y-6">
        <h2 className="text-sm font-semibold text-white">Configure Draw</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Month */}
          <div>
            <label className="block text-xs text-white/40 mb-1">Month</label>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:outline-none [color-scheme:dark]">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i).toLocaleDateString('en-GB', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          {/* Year */}
          <div>
            <label className="block text-xs text-white/40 mb-1">Year</label>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:outline-none [color-scheme:dark]">
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {/* Mode */}
          <div>
            <label className="block text-xs text-white/40 mb-1">Draw Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value as DrawMode)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:outline-none [color-scheme:dark]">
              <option value="random">Random</option>
              <option value="algorithmic">Algorithmic</option>
            </select>
          </div>
          {/* Strategy (only for algorithmic) */}
          <div>
            <label className="block text-xs text-white/40 mb-1">Strategy</label>
            <select value={strategy} onChange={(e) => setStrategy(e.target.value as AlgoStrategy)}
              disabled={mode !== 'algorithmic'}
              className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:outline-none disabled:opacity-40 [color-scheme:dark]">
              <option value="high-freq">High frequency</option>
              <option value="low-freq">Low frequency</option>
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <button onClick={handleSimulate} disabled={isPending}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/15 disabled:opacity-50 border border-white/10 transition-all">
            {isPending && step === 'idle' ? '⏳ Simulating…' : '🎲 Simulate (preview only)'}
          </button>
          <button onClick={handleRun} disabled={isPending || step === 'ran'}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition-all">
            {isPending && step === 'simulated' ? '⏳ Running…' : '▶ Run Draw (saves to DB)'}
          </button>
          {step === 'ran' && runDrawId && (
            <button onClick={handlePublish} disabled={isPending}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all">
              {isPending ? '⏳ Publishing…' : '✅ Publish Results'}
            </button>
          )}
        </div>

        {/* Message */}
        {msg && (
          <div className={`p-3 rounded-xl text-sm ${msg.type === 'ok' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
            {msg.text}
          </div>
        )}
      </div>

      {/* ── Simulation preview ── */}
      {simResult && (
        <div className="p-6 rounded-2xl bg-violet-500/5 border border-violet-500/15 space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-400" />
            <h2 className="text-sm font-semibold text-white">Simulation Preview</h2>
            <span className="text-xs text-white/30">(not saved)</span>
          </div>

          {/* Drawn numbers */}
          <div>
            <p className="text-xs text-white/40 mb-2">Drawn Numbers</p>
            <div className="flex gap-3">
              {simResult.drawnNumbers.map((n) => (
                <div key={n} className="w-12 h-12 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center font-bold text-white text-lg">
                  {n}
                </div>
              ))}
            </div>
          </div>

          {/* Tier counts + prizes */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '🏆 Jackpot (5)', count: simResult.tierCounts.jackpot,  perWinner: simResult.distribution.jackpotPerWinner, pool: simResult.prizePool.jackpotAlloc },
              { label: '4 Match',        count: simResult.tierCounts.tier_4,   perWinner: simResult.distribution.tier4PerWinner,   pool: simResult.prizePool.tier4Alloc },
              { label: '3 Match',        count: simResult.tierCounts.tier_3,   perWinner: simResult.distribution.tier3PerWinner,   pool: simResult.prizePool.tier3Alloc },
            ].map((tier) => (
              <div key={tier.label} className="p-3 rounded-xl bg-white/5 border border-white/8">
                <p className="text-xs text-white/40">{tier.label}</p>
                <p className="text-2xl font-bold text-white">{tier.count}</p>
                <p className="text-xs text-white/50 mt-1">
                  Pool: £{tier.pool.toFixed(2)}
                  {tier.count > 0 && ` · £${tier.perWinner.toFixed(2)} each`}
                </p>
              </div>
            ))}
          </div>

          <div className="text-xs text-white/30">
            {simResult.activeSubscribers} active subscribers ·
            Total pool: £{simResult.prizePool.totalPool.toFixed(2)} ·
            {simResult.distribution.jackpotCarryOut > 0
              ? ` £${simResult.distribution.jackpotCarryOut.toFixed(2)} carries to next month`
              : ' Jackpot won — no carry'}
          </div>
        </div>
      )}
    </div>
  )
}
