'use client'

import { useState, useTransition } from 'react'
import Link                        from 'next/link'
import { signUpAction }            from '@/actions/auth'
import Logo                        from '@/components/layout/Logo'

export default function SignupPage() {
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirm  = formData.get('confirmPassword') as string

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    startTransition(async () => {
      const result = await signUpAction(formData)
      if (result?.error)   setError(result.error)
      if (result?.success) setSuccess(result.success)
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6 lg:hidden">
          <Logo size="md" />
        </div>
        <h1 className="text-3xl font-bold text-white">Create your account</h1>
        <p className="mt-2 text-white/50 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>

      {/* Error / Success banners */}
      {error && (
        <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
          <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-emerald-300 text-sm">{success}</p>
        </div>
      )}

      {/* Form */}
      {!success && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-1.5">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="Jane Smith"
              className="
                w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25
                bg-white/5 border border-white/10
                focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50
                transition-all duration-200
              "
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="
                w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25
                bg-white/5 border border-white/10
                focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50
                transition-all duration-200
              "
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Min. 8 characters"
              className="
                w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25
                bg-white/5 border border-white/10
                focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50
                transition-all duration-200
              "
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/70 mb-1.5">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Repeat your password"
              className="
                w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25
                bg-white/5 border border-white/10
                focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50
                transition-all duration-200
              "
            />
          </div>

          <p className="text-white/30 text-xs">
            By creating an account you agree to our{' '}
            <Link href="/terms" className="text-violet-400 hover:underline">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-violet-400 hover:underline">Privacy Policy</Link>.
          </p>

          <button
            id="signup-submit"
            type="submit"
            disabled={isPending}
            className="
              w-full py-3 px-4 rounded-xl font-semibold text-sm text-white
              bg-gradient-to-r from-violet-600 to-indigo-600
              hover:from-violet-500 hover:to-indigo-500
              disabled:opacity-60 disabled:cursor-not-allowed
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
                Creating account…
              </>
            ) : 'Create account'}
          </button>
        </form>
      )}

      {success && (
        <Link
          href="/login"
          className="
            mt-4 w-full py-3 px-4 rounded-xl font-semibold text-sm text-white
            bg-gradient-to-r from-violet-600 to-indigo-600
            hover:from-violet-500 hover:to-indigo-500
            transition-all duration-200 flex items-center justify-center
          "
        >
          Go to sign in →
        </Link>
      )}
    </div>
  )
}
