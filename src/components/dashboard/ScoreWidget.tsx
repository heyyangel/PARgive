import Link                        from 'next/link'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getScores } from '@/actions/scores'
import { computeScoreStats } from '@/lib/score-stats'
import ScoreForm from '@/components/scores/ScoreForm'
import ScoreList from '@/components/scores/ScoreList'

export default async function ScoreWidget({ userId }: { userId: string }) {
  // getScores reads auth from cookie — no need to pass userId
  const scores  = await getScores()
  const stats   = computeScoreStats(scores)
  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-xs font-medium text-white/50 uppercase tracking-widest mb-1">
            My Scores
          </p>
          <div className="flex items-center gap-4">
            {stats.average !== null && (
              <span className="text-white text-sm">
                Avg <strong className="text-violet-300">{stats.average}</strong>
              </span>
            )}
            {stats.best !== null && (
              <span className="text-white text-sm">
                Best <strong className="text-emerald-300">{stats.best}</strong>
              </span>
            )}
            <span className="text-white/30 text-xs">{scores.length}/5 stored</span>
          </div>
        </div>
        <Link
          href="/scores"
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          Full score page →
        </Link>
      </div>

      {/* Desktop: side-by-side. Mobile: stacked */}
      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6 items-start">
        {/* Quick-add form */}
        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/8">
          <p className="text-sm font-medium text-white mb-4">Add a Round</p>
          <ScoreForm todayStr={todayStr} />
        </div>

        {/* Score list */}
        <ScoreList scores={scores} todayStr={todayStr} />
      </div>
    </div>
  )
}
