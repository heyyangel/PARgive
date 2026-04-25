'use client'

import { useState, useTransition } from 'react'
import { updateContributionPercentageAction } from '@/actions/charities'
import { computeContributionAmount } from '@/lib/contribution'

interface Props {
  currentPercentage: number
  plan:              string   // 'basic' | 'premium' | 'free'
  charityName:       string | null
}

const MIN_PERCENTAGE = 10
const MAX_PERCENTAGE = 100

export default function ContributionEditor({ currentPercentage, plan, charityName }: Props) {
  const [percentage, setPercentage] = useState(currentPercentage)
  const [message,    setMessage]    = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [isPending,  startTransition] = useTransition()

  const isUnchanged = percentage === currentPercentage
  const isBelowMin  = percentage < MIN_PERCENTAGE

  const { amount, period, planLabel } = computeContributionAmount(plan, percentage)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateContributionPercentageAction(formData)
      if (result?.error)   setMessage({ type: 'err', text: result.error })
      if (result?.success) setMessage({ type: 'ok',  text: result.success })
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Live preview ── */}
      <div className="p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
        <p className="text-xs text-white/40 mb-1">Your current contribution</p>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-white">
            £{amount.toFixed(2)}
          </span>
          <span className="text-white/40 text-sm mb-1">/ {period}</span>
        </div>
        {charityName && (
          <p className="text-xs text-emerald-400 mt-1">
            → {charityName}
          </p>
        )}
        <p className="text-xs text-white/30 mt-1">
          {percentage}% of your {planLabel} plan · auto-contributed
        </p>
      </div>

      {/* ── Slider ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="charity_percentage" className="text-sm font-medium text-white/60">
            Contribution rate
          </label>
          <span className="text-sm font-bold text-white tabular-nums">{percentage}%</span>
        </div>

        <input
          id="charity_percentage"
          name="charity_percentage"
          type="range"
          min={MIN_PERCENTAGE}
          max={MAX_PERCENTAGE}
          step={1}
          value={percentage}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (v >= MIN_PERCENTAGE) setPercentage(v)
          }}
          className="
            w-full h-2 rounded-full appearance-none cursor-pointer
            bg-white/10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-gradient-to-br
            [&::-webkit-slider-thumb]:from-violet-500 [&::-webkit-slider-thumb]:to-indigo-500
            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-violet-900/50
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/20
          "
          style={{
            background: `linear-gradient(to right, #7c3aed ${((percentage - MIN_PERCENTAGE) / (MAX_PERCENTAGE - MIN_PERCENTAGE)) * 100}%, rgba(255,255,255,0.1) 0%)`,
          }}
        />

        <div className="flex justify-between text-[10px] text-white/25 mt-1.5">
          <span>{MIN_PERCENTAGE}% (min)</span>
          <span>50%</span>
          <span>{MAX_PERCENTAGE}%</span>
        </div>

        {/* Manual input for precise entry */}
        <div className="mt-4 flex items-center gap-3">
          <label className="text-xs text-white/40 flex-shrink-0">Or enter a value:</label>
          <div className="relative">
            <input
              type="number"
              min={MIN_PERCENTAGE}
              max={MAX_PERCENTAGE}
              value={percentage}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (v >= MIN_PERCENTAGE && v <= MAX_PERCENTAGE) setPercentage(v)
              }}
              className="
                w-20 px-3 py-1.5 pr-6 rounded-lg text-sm text-white text-right
                bg-white/5 border border-white/10
                focus:outline-none focus:ring-2 focus:ring-violet-500/40
                [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none
              "
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 text-xs">%</span>
          </div>
        </div>
      </div>

      {/* ── Lock warning ── */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/15">
        <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-xs text-amber-300/70">
          Contributions can only be <strong className="text-amber-300">increased</strong>, not reduced.
          The minimum is {MIN_PERCENTAGE}%. Your current rate is {currentPercentage}%.
        </p>
      </div>

      {/* Feedback */}
      {message && (
        <p className={`text-sm ${message.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}

      <button
        id="save-contribution"
        type="submit"
        disabled={isPending || isUnchanged || isBelowMin}
        className="
          w-full py-2.5 rounded-xl text-sm font-semibold text-white
          bg-gradient-to-r from-violet-600 to-indigo-600
          hover:from-violet-500 hover:to-indigo-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
        "
      >
        {isPending ? 'Saving…'
          : isUnchanged ? 'No change'
          : `Save — ${percentage}% (£${amount.toFixed(2)}/${period})`}
      </button>
    </form>
  )
}
