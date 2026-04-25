import type { Metadata } from 'next'
import { redirect }      from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getScores } from '@/actions/scores'
import { computeScoreStats } from '@/lib/score-stats'
import ScoreForm from '@/components/scores/ScoreForm'
import ScoreList from '@/components/scores/ScoreList'

export const metadata: Metadata = {
  title:       'My Scores — PARgive',
  description: 'Track your Stableford golf scores across your last 5 rounds.',
}

const TIER_CONFIG = [
  { min: 36, label: 'Outstanding', color: 'text-violet-300',  bg: 'bg-violet-500/15 border-violet-500/25' },
  { min: 29, label: 'Good',        color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/25' },
  { min: 20, label: 'Average',     color: 'text-sky-300',     bg: 'bg-sky-500/15 border-sky-500/25' },
  { min: 1,  label: 'Developing',  color: 'text-amber-300',   bg: 'bg-amber-500/15 border-amber-500/25' },
]

function scoreTier(value: number | null) {
  if (value === null) return null
  return TIER_CONFIG.find((t) => value >= t.min) ?? TIER_CONFIG[TIER_CONFIG.length - 1]
}

export default async function ScoresPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const scores = await getScores()
  const stats  = computeScoreStats(scores)
  const tier   = scoreTier(stats.average)

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <main className="min-h-screen bg-[#050508]">
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 55% 35% at 50% 0%, rgba(109,40,217,0.12) 0%, transparent 65%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Page header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">My Scores</h1>
          <p className="text-white/40 text-sm mt-1">
            Stableford · Last {scores.length} of 5 stored rounds
          </p>
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Average',
              value: stats.average ?? '—',
              sub:   tier ? (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${tier.bg} ${tier.color}`}>
                  {tier.label}
                </span>
              ) : null,
            },
            {
              label: 'Best Round',
              value: stats.best ?? '—',
              sub:   stats.best ? <span className="text-xs text-white/30">Stableford pts</span> : null,
            },
            {
              label: 'Worst Round',
              value: stats.worst ?? '—',
              sub:   stats.worst ? <span className="text-xs text-white/30">Stableford pts</span> : null,
            },
            {
              label: 'Rounds Stored',
              value: `${scores.length} / 5`,
              sub:   scores.length === 5
                ? <span className="text-xs text-amber-400">Next entry replaces oldest</span>
                : <span className="text-xs text-white/30">{5 - scores.length} slot{5 - scores.length !== 1 ? 's' : ''} remaining</span>,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-xl bg-white/[0.04] border border-white/10"
            >
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <div className="mt-1">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">

          {/* ── Entry form ── */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 sticky top-6">
            <h2 className="text-base font-semibold text-white mb-1">Add a Round</h2>
            <p className="text-white/40 text-sm mb-6">
              Enter your Stableford points (1–45) and the date played.
              {scores.length === 5 && (
                <span className="block mt-1 text-amber-400/80">
                  Your oldest score will be replaced.
                </span>
              )}
            </p>
            <ScoreForm todayStr={todayStr} />
          </div>

          {/* ── Score list ── */}
          <div>
            <ScoreList scores={scores} todayStr={todayStr} />
          </div>
        </div>
      </div>
    </main>
  )
}
