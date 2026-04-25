'use client'

import { useState, useTransition } from 'react'
import { updatePasswordAction }    from '@/actions/auth'

export default function PasswordForm() {
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updatePasswordAction(formData)
      if (result?.error)   setMessage({ type: 'err', text: result.error })
      if (result?.success) {
        setMessage({ type: 'ok', text: result.success });
        (e.target as HTMLFormElement).reset()
      }
    })
  }

  const inputClass = `
    w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25
    bg-white/5 border border-white/10
    focus:outline-none focus:ring-2 focus:ring-violet-500/50
    transition-all duration-200
  `

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-white/60 mb-1.5">
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          placeholder="••••••••"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-white/60 mb-1.5">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          placeholder="Min. 8 characters"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/60 mb-1.5">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          placeholder="Repeat new password"
          className={inputClass}
        />
      </div>

      {message && (
        <p className={`text-sm ${message.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}

      <button
        id="update-password"
        type="submit"
        disabled={isPending}
        className="
          px-6 py-2.5 rounded-xl text-sm font-semibold text-white
          bg-gradient-to-r from-violet-600 to-indigo-600
          hover:from-violet-500 hover:to-indigo-500
          disabled:opacity-50 transition-all duration-200
        "
      >
        {isPending ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}
