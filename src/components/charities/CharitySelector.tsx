'use client'

import { useState, useTransition } from 'react'
import { updateUserCharityAction }  from '@/actions/charities'
import type { CharityRow }          from '@/lib/supabase/types'

interface Props {
  charities:        CharityRow[]
  currentCharityId: string | null
}

export default function CharitySelector({ charities, currentCharityId }: Props) {
  const [selected,  setSelected]  = useState(currentCharityId ?? '')
  const [message,   setMessage]   = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)

    if (!selected) {
      setMessage({ type: 'err', text: 'Please select a charity.' })
      return
    }

    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateUserCharityAction(formData)
      if (result?.error)   setMessage({ type: 'err', text: result.error })
      if (result?.success) setMessage({ type: 'ok',  text: result.success })
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="charity_id" value={selected} />

      {/* Radio list */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {charities.map((charity) => {
          const isChecked = selected === charity.id
          return (
            <label
              key={charity.id}
              htmlFor={`charity-radio-${charity.id}`}
              className={`
                flex items-center gap-3 p-3.5 rounded-xl cursor-pointer
                border transition-all duration-200
                ${isChecked
                  ? 'bg-violet-600/15 border-violet-500/40'
                  : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'}
              `}
            >
              {/* Radio */}
              <div className={`
                w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                transition-all duration-200
                ${isChecked ? 'border-violet-400 bg-violet-500' : 'border-white/30'}
              `}>
                {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>

              <input
                id={`charity-radio-${charity.id}`}
                type="radio"
                name="charity_radio"
                value={charity.id}
                checked={isChecked}
                onChange={() => setSelected(charity.id)}
                className="sr-only"
              />

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">{charity.name}</p>
                  {charity.is_featured && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/25 flex-shrink-0">
                      Featured
                    </span>
                  )}
                </div>
                {charity.description && (
                  <p className="text-xs text-white/40 mt-0.5 truncate">{charity.description}</p>
                )}
              </div>
            </label>
          )
        })}
      </div>

      {/* Feedback */}
      {message && (
        <p className={`text-sm ${message.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}

      <button
        id="save-charity-selection"
        type="submit"
        disabled={isPending || selected === (currentCharityId ?? '')}
        className="
          w-full py-2.5 rounded-xl text-sm font-semibold text-white
          bg-gradient-to-r from-violet-600 to-indigo-600
          hover:from-violet-500 hover:to-indigo-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
        "
      >
        {isPending ? 'Saving…' : 'Save selection'}
      </button>
    </form>
  )
}
