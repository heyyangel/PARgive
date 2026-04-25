'use client'

import { useState, useTransition } from 'react'
import { updateUserCharityAction }  from '@/actions/charities'

interface Props {
  charityId:        string
  charityName:      string
  isCurrentCharity: boolean
}

export default function SetCharityButton({ charityId, charityName, isCurrentCharity }: Props) {
  const [done,     setDone]     = useState(isCurrentCharity)
  const [error,    setError]    = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSet() {
    setError(null)
    const formData = new FormData()
    formData.set('charity_id', charityId)

    startTransition(async () => {
      const result = await updateUserCharityAction(formData)
      if (result?.error) setError(result.error)
      else               setDone(true)
    })
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-emerald-300 text-sm font-medium">Your charity</span>
      </div>
    )
  }

  return (
    <div>
      <button
        id={`set-charity-${charityId}`}
        onClick={handleSet}
        disabled={isPending}
        className="
          px-5 py-2.5 rounded-xl font-semibold text-sm text-white
          bg-gradient-to-r from-violet-600 to-indigo-600
          hover:from-violet-500 hover:to-indigo-500
          disabled:opacity-50 transition-all duration-200 shadow-lg shadow-violet-900/30
          flex items-center gap-2
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Support {charityName}
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  )
}
