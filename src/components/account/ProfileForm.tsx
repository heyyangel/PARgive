'use client'

import { useState, useTransition } from 'react'
import { updateProfileAction }     from '@/actions/auth'

export default function ProfileForm({ initialName }: { initialName: string }) {
  const [name,    setName]    = useState(initialName)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateProfileAction(formData)
      if (result?.error)   setMessage({ type: 'err', text: result.error })
      if (result?.success) setMessage({ type: 'ok',  text: result.success })
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="profile-name" className="block text-sm font-medium text-white/60 mb-1.5">
          Display name
        </label>
        <input
          id="profile-name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="
            w-full px-4 py-3 rounded-xl text-sm text-white
            bg-white/5 border border-white/10
            focus:outline-none focus:ring-2 focus:ring-violet-500/50
            transition-all duration-200
          "
        />
      </div>

      {message && (
        <p className={`text-sm ${message.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}

      <button
        id="save-profile"
        type="submit"
        disabled={isPending}
        className="
          px-6 py-2.5 rounded-xl text-sm font-semibold text-white
          bg-gradient-to-r from-violet-600 to-indigo-600
          hover:from-violet-500 hover:to-indigo-500
          disabled:opacity-50 transition-all duration-200
        "
      >
        {isPending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
