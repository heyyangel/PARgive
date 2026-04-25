'use client'

import { useState, useTransition } from 'react'
import { createDonationSessionAction } from '@/actions/charities'

const PRESET_AMOUNTS = [5, 10, 25, 50]

interface Props {
  charityId:   string
  charityName: string
}

export default function DonatePanel({ charityId, charityName }: Props) {
  const [amount,    setAmount]    = useState<string>('10')
  const [customAmt, setCustomAmt] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handlePreset(val: number) {
    setAmount(String(val))
    setCustomAmt(false)
    setError(null)
  }

  async function handleDonate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed < 1) {
      setError('Minimum donation is £1.00.')
      return
    }
    if (parsed > 10000) {
      setError('Maximum single donation is £10,000.')
      return
    }

    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createDonationSessionAction(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.url) {
        window.location.href = result.url
      }
    })
  }

  return (
    <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 space-y-5">
      <div>
        <h3 className="text-base font-semibold text-white mb-1">Make a donation</h3>
        <p className="text-white/40 text-xs">
          One-time donation, independent of your subscription.
          100% goes to {charityName}.
        </p>
      </div>

      <form onSubmit={handleDonate} className="space-y-4">
        <input type="hidden" name="charity_id"   value={charityId} />
        <input type="hidden" name="charity_name" value={charityName} />
        <input type="hidden" name="amount"       value={amount} />

        {/* Preset buttons */}
        <div>
          <p className="text-xs text-white/40 mb-2">Quick amounts</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePreset(preset)}
                className={`
                  py-2 rounded-xl text-sm font-semibold transition-all duration-200
                  ${!customAmt && amount === String(preset)
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20'}
                `}
              >
                £{preset}
              </button>
            ))}
          </div>
        </div>

        {/* Custom amount */}
        <div>
          <button
            type="button"
            onClick={() => { setCustomAmt(true); setAmount('') }}
            className={`text-xs transition-colors ${customAmt ? 'text-violet-400' : 'text-white/30 hover:text-white/60'}`}
          >
            {customAmt ? '↩ Or pick a preset' : '+ Enter a custom amount'}
          </button>

          {customAmt && (
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">£</span>
              <input
                type="number"
                min="1"
                max="10000"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="
                  w-full pl-7 pr-4 py-3 rounded-xl text-sm text-white
                  bg-white/5 border border-white/10
                  focus:outline-none focus:ring-2 focus:ring-violet-500/40
                  [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none
                "
              />
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <button
          id="donate-submit"
          type="submit"
          disabled={isPending || !amount || parseFloat(amount) < 1}
          className="
            w-full py-3 rounded-xl font-semibold text-sm text-white
            bg-gradient-to-r from-emerald-600 to-teal-600
            hover:from-emerald-500 hover:to-teal-500
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 shadow-lg shadow-emerald-900/30
            flex items-center justify-center gap-2
          "
        >
          {isPending ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Redirecting…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Donate £{parseFloat(amount || '0').toFixed(2)}
            </>
          )}
        </button>
      </form>

      <p className="text-white/20 text-[10px] text-center">
        Secured by Stripe · No account required
      </p>
    </div>
  )
}
