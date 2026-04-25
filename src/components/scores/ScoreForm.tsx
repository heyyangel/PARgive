'use client'

import { useState, useTransition, useRef } from 'react'
import { addScoreAction } from '@/actions/scores'

interface Props {
  todayStr: string   // 'YYYY-MM-DD' passed from server to avoid client/server date mismatch
}

const MIN = 1
const MAX = 45

export default function ScoreForm({ todayStr }: Props) {
  const formRef = useRef<HTMLFormElement>(null)

  const [scoreValue, setScoreValue] = useState('')
  const [scoreDate,  setScoreDate]  = useState(todayStr)
  const [message,    setMessage]    = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [isPending,  startTransition] = useTransition()

  // Client-side preview: colour the score input border based on range
  const numVal = Number(scoreValue)
  const inputTier =
    !scoreValue || isNaN(numVal) ? 'neutral'
    : numVal >= 36               ? 'outstanding'
    : numVal >= 29               ? 'good'
    : numVal >= 20               ? 'average'
    : numVal >= 1                ? 'developing'
    : 'error'

  const tierBorderClass: Record<string, string> = {
    neutral:     'border-white/10 focus:ring-violet-500/50 focus:border-violet-500/50',
    outstanding: 'border-violet-400/50  focus:ring-violet-400/40 focus:border-violet-400/60',
    good:        'border-emerald-400/50 focus:ring-emerald-400/40 focus:border-emerald-400/60',
    average:     'border-sky-400/50     focus:ring-sky-400/40    focus:border-sky-400/60',
    developing:  'border-amber-400/50   focus:ring-amber-400/40  focus:border-amber-400/60',
    error:       'border-red-400/50     focus:ring-red-400/40    focus:border-red-400/60',
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)

    // Client-side pre-validation for instant feedback
    const val = Number(scoreValue)
    if (!scoreValue || isNaN(val) || !Number.isInteger(val) || val < MIN || val > MAX) {
      setMessage({ type: 'err', text: `Score must be a whole number between ${MIN} and ${MAX}.` })
      return
    }
    if (scoreDate > todayStr) {
      setMessage({ type: 'err', text: 'Date cannot be in the future.' })
      return
    }

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await addScoreAction(formData)
      if (result?.error) {
        setMessage({ type: 'err', text: result.error })
      } else if (result?.success) {
        setMessage({ type: 'ok', text: result.success })
        setScoreValue('')
        setScoreDate(todayStr)
        formRef.current?.reset()
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5" noValidate>

      {/* Score value field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="score_value" className="text-sm font-medium text-white/60">
            Stableford Points
          </label>
          <span className="text-xs text-white/30">
            Range: {MIN}–{MAX}
          </span>
        </div>

        <div className="relative">
          <input
            id="score_value"
            name="score_value"
            type="number"
            min={MIN}
            max={MAX}
            step={1}
            required
            value={scoreValue}
            onChange={(e) => setScoreValue(e.target.value)}
            placeholder="e.g. 32"
            className={`
              w-full px-4 py-3 pr-16 rounded-xl text-2xl font-bold text-white
              placeholder:text-white/20 placeholder:font-normal placeholder:text-base
              bg-white/5 border transition-all duration-200
              focus:outline-none focus:ring-2
              [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none
              ${tierBorderClass[inputTier]}
            `}
          />
          {/* Live tier badge */}
          {scoreValue && !isNaN(numVal) && numVal >= MIN && numVal <= MAX && (
            <span className={`
              absolute right-3 top-1/2 -translate-y-1/2
              text-xs font-medium px-2 py-0.5 rounded-full border
              ${inputTier === 'outstanding' ? 'bg-violet-500/15 border-violet-500/25 text-violet-300' : ''}
              ${inputTier === 'good'        ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300' : ''}
              ${inputTier === 'average'     ? 'bg-sky-500/15 border-sky-500/25 text-sky-300' : ''}
              ${inputTier === 'developing'  ? 'bg-amber-500/15 border-amber-500/25 text-amber-300' : ''}
            `}>
              {inputTier === 'outstanding' ? 'Outstanding'
               : inputTier === 'good'     ? 'Good'
               : inputTier === 'average'  ? 'Average'
               : 'Developing'}
            </span>
          )}
        </div>

        {/* Visual range bar */}
        <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width:      numVal >= MIN && numVal <= MAX ? `${((numVal - MIN) / (MAX - MIN)) * 100}%` : '0%',
              background: inputTier === 'outstanding' ? 'linear-gradient(to right,#7c3aed,#818cf8)'
                        : inputTier === 'good'        ? 'linear-gradient(to right,#059669,#34d399)'
                        : inputTier === 'average'     ? 'linear-gradient(to right,#0284c7,#38bdf8)'
                        : inputTier === 'developing'  ? 'linear-gradient(to right,#d97706,#fbbf24)'
                        : '#374151',
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-white/20 mt-1">
          <span>{MIN}</span>
          <span>20</span>
          <span>29</span>
          <span>36</span>
          <span>{MAX}</span>
        </div>
      </div>

      {/* Date field */}
      <div>
        <label htmlFor="score_date" className="block text-sm font-medium text-white/60 mb-1.5">
          Date Played
        </label>
        <input
          id="score_date"
          name="score_date"
          type="date"
          required
          max={todayStr}
          value={scoreDate}
          onChange={(e) => setScoreDate(e.target.value)}
          className="
            w-full px-4 py-3 rounded-xl text-sm text-white
            bg-white/5 border border-white/10
            focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50
            transition-all duration-200
            [color-scheme:dark]
          "
        />
      </div>

      {/* Feedback */}
      {message && (
        <div className={`
          p-3 rounded-xl text-sm flex items-start gap-2
          ${message.type === 'ok'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
            : 'bg-red-500/10 border border-red-500/20 text-red-300'}
        `}>
          {message.type === 'ok'
            ? <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            : <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          }
          {message.text}
        </div>
      )}

      <button
        id="add-score-submit"
        type="submit"
        disabled={isPending}
        className="
          w-full py-3 rounded-xl font-semibold text-sm text-white
          bg-gradient-to-r from-violet-600 to-indigo-600
          hover:from-violet-500 hover:to-indigo-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 shadow-lg shadow-violet-900/30
          flex items-center justify-center gap-2
        "
      >
        {isPending ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Score
          </>
        )}
      </button>
    </form>
  )
}
