'use client'

import { useState, useTransition } from 'react'
import { updateScoreAction, deleteScoreAction } from '@/actions/scores'
import type { ScoreRow } from '@/lib/supabase/types'

// ─────────────────────────────────────────────────────────────
// TIER CONFIG
// ─────────────────────────────────────────────────────────────
const TIERS = [
  { min: 36, label: 'Outstanding', textColor: 'text-violet-300',  bgClass: 'bg-violet-500/15 border-violet-500/25',  barColor: 'from-violet-500 to-indigo-500' },
  { min: 29, label: 'Good',        textColor: 'text-emerald-300', bgClass: 'bg-emerald-500/15 border-emerald-500/25', barColor: 'from-emerald-500 to-teal-500' },
  { min: 20, label: 'Average',     textColor: 'text-sky-300',     bgClass: 'bg-sky-500/15 border-sky-500/25',         barColor: 'from-sky-500 to-cyan-500' },
  { min: 1,  label: 'Developing',  textColor: 'text-amber-300',   bgClass: 'bg-amber-500/15 border-amber-500/25',     barColor: 'from-amber-500 to-orange-500' },
] as const

function getTier(value: number) {
  return TIERS.find((t) => value >= t.min) ?? TIERS[TIERS.length - 1]
}

const MIN = 1
const MAX = 45

// ─────────────────────────────────────────────────────────────
// INLINE EDIT FORM
// ─────────────────────────────────────────────────────────────
function EditForm({
  score,
  todayStr,
  onCancel,
  onSaved,
}: {
  score:    ScoreRow
  todayStr: string
  onCancel: () => void
  onSaved:  (message: string) => void
}) {
  const [val,  setVal]  = useState(String(score.score_value))
  const [date, setDate] = useState(score.score_date)
  const [err,  setErr]  = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr(null)

    const numVal = Number(val)
    if (!val || isNaN(numVal) || !Number.isInteger(numVal) || numVal < MIN || numVal > MAX) {
      setErr(`Score must be a whole number between ${MIN} and ${MAX}.`)
      return
    }
    if (date > todayStr) {
      setErr('Date cannot be in the future.')
      return
    }

    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateScoreAction(formData)
      if (result?.error) setErr(result.error)
      else               onSaved(result?.success ?? 'Score updated.')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 pt-3 border-t border-white/10">
      <input type="hidden" name="id" value={score.id} />

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-white/40 mb-1">Points</label>
          <input
            name="score_value"
            type="number"
            min={MIN}
            max={MAX}
            step={1}
            required
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="
              w-full px-3 py-2 rounded-lg text-sm text-white font-semibold
              bg-white/5 border border-white/10
              focus:outline-none focus:ring-2 focus:ring-violet-500/40
              [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none
            "
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-white/40 mb-1">Date</label>
          <input
            name="score_date"
            type="date"
            required
            max={todayStr}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="
              w-full px-3 py-2 rounded-lg text-sm text-white
              bg-white/5 border border-white/10
              focus:outline-none focus:ring-2 focus:ring-violet-500/40
              [color-scheme:dark]
            "
          />
        </div>
      </div>

      {err && <p className="text-xs text-red-400">{err}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="
            flex-1 py-2 rounded-lg text-xs font-semibold text-white
            bg-gradient-to-r from-violet-600 to-indigo-600
            hover:from-violet-500 hover:to-indigo-500
            disabled:opacity-50 transition-all duration-200
          "
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="
            px-4 py-2 rounded-lg text-xs font-medium text-white/50
            bg-white/5 hover:bg-white/10 hover:text-white
            transition-all duration-200
          "
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────
// SCORE CARD
// ─────────────────────────────────────────────────────────────
function ScoreCard({
  score,
  rank,
  todayStr,
}: {
  score:    ScoreRow
  rank:     number
  todayStr: string
}) {
  const [editing,      setEditing]      = useState(false)
  const [confirmDel,   setConfirmDel]   = useState(false)
  const [flashMessage, setFlashMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [isDeleting,   startTransition] = useTransition()

  const tier      = getTier(score.score_value)
  const barWidth  = `${((score.score_value - MIN) / (MAX - MIN)) * 100}%`
  const formatted = new Date(score.score_date + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  function handleSaved(message: string) {
    setEditing(false)
    setFlashMessage({ type: 'ok', text: message })
    setTimeout(() => setFlashMessage(null), 3000)
  }

  async function handleDelete() {
    startTransition(async () => {
      const result = await deleteScoreAction(score.id)
      if (result?.error) {
        setFlashMessage({ type: 'err', text: result.error })
        setConfirmDel(false)
      }
      // On success page revalidates — component unmounts automatically
    })
  }

  return (
    <div className="
      p-5 rounded-2xl
      bg-white/[0.04] border border-white/10
      hover:border-white/15 hover:bg-white/[0.06]
      transition-all duration-300
    ">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        {/* Rank + score */}
        <div className="flex items-center gap-4">
          <span className="text-white/20 text-xs font-mono w-4 text-right flex-shrink-0">
            #{rank}
          </span>
          <span className="text-4xl font-bold text-white leading-none tabular-nums">
            {score.score_value}
          </span>
          <div>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${tier.bgClass} ${tier.textColor}`}>
              {tier.label}
            </span>
            <p className="text-white/40 text-xs mt-1">{formatted}</p>
          </div>
        </div>

        {/* Action buttons */}
        {!editing && !confirmDel && (
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              onClick={() => setEditing(true)}
              title="Edit score"
              className="
                p-2 rounded-lg text-white/30 hover:text-white
                hover:bg-white/10 transition-all duration-200
              "
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => setConfirmDel(true)}
              title="Delete score"
              className="
                p-2 rounded-lg text-white/30 hover:text-red-400
                hover:bg-red-500/10 transition-all duration-200
              "
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tier.barColor} transition-all duration-500`}
          style={{ width: barWidth }}
        />
      </div>

      {/* Flash message */}
      {flashMessage && (
        <p className={`mt-3 text-xs ${flashMessage.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
          {flashMessage.text}
        </p>
      )}

      {/* Inline delete confirm */}
      {confirmDel && !editing && (
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
          <p className="text-xs text-white/60">Remove this score?</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500/80 hover:bg-red-500 disabled:opacity-50 transition-all"
            >
              {isDeleting ? 'Removing…' : 'Yes, remove'}
            </button>
            <button
              onClick={() => setConfirmDel(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-white/50 bg-white/5 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Inline edit form */}
      {editing && (
        <EditForm
          score={score}
          todayStr={todayStr}
          onCancel={() => setEditing(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SCORE LIST
// ─────────────────────────────────────────────────────────────
interface Props {
  scores:   ScoreRow[]
  todayStr: string
}

export default function ScoreList({ scores, todayStr }: Props) {
  if (scores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-white/40 text-sm font-medium">No rounds recorded yet</p>
        <p className="text-white/25 text-xs mt-1">Add your first Stableford score using the form.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-white/70">
          Recent Rounds
          <span className="text-white/30 font-normal ml-2">({scores.length}/5 stored)</span>
        </h2>
        <span className="text-xs text-white/30">Most recent first</span>
      </div>

      {/* Scores in reverse chronological order */}
      {scores.map((score, i) => (
        <ScoreCard
          key={score.id}
          score={score}
          rank={i + 1}
          todayStr={todayStr}
        />
      ))}
    </div>
  )
}
