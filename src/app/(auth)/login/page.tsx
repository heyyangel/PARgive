'use client'

import { useState, useTransition, Suspense } from 'react'
import Link                        from 'next/link'
import { useSearchParams }         from 'next/navigation'
import { signInAction }            from '@/actions/auth'
import Logo                        from '@/components/layout/Logo'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirectTo') ?? '/dashboard'
  const urlError     = searchParams.get('error')

  const [error,     setError]     = useState<string | null>(urlError)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('redirectTo', redirectTo)

    startTransition(async () => {
      const result = await signInAction(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6 lg:hidden">
          <Logo size="md" />
        </div>
        <h1 className="text-3xl font-bold text-white">Welcome back</h1>
        <p className="mt-2 text-white/50 text-sm">
          Don't have an account?{' '}
          <Link href="/signup" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
            Sign up free
          </Link>
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
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
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-white/70">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="
              w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25
              bg-white/5 border border-white/10
              focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50
              transition-all duration-200
            "
          />
        </div>

        <button
          id="login-submit"
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
              Signing in…
            </>
          ) : 'Sign in'}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/30 text-xs">or continue with</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* OAuth placeholder */}
      <button
        id="google-login"
        type="button"
        className="
          w-full py-3 px-4 rounded-xl font-medium text-sm text-white/80
          bg-white/5 border border-white/10
          hover:bg-white/10 hover:text-white
          transition-all duration-200 flex items-center justify-center gap-3
        "
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="animate-pulse bg-white/5 h-96 rounded-xl w-full" />}>
      <LoginForm />
    </Suspense>
  )
}
