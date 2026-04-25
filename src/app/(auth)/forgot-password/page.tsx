'use client'

import Link from 'next/link'
import Logo from '@/components/layout/Logo'

export default function ForgotPasswordPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6 lg:hidden">
          <Logo size="md" />
        </div>
        <h1 className="text-3xl font-bold text-white">Reset password</h1>
        <p className="mt-2 text-white/50 text-sm">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); alert("Password reset functionality to be implemented."); }}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1.5">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
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

        <button
          type="submit"
          className="
            w-full py-3 px-4 rounded-xl font-semibold text-sm text-white
            bg-gradient-to-r from-violet-600 to-indigo-600
            hover:from-violet-500 hover:to-indigo-500
            transition-all duration-200 shadow-lg shadow-violet-900/30
            flex items-center justify-center gap-2
          "
        >
          Send reset link
        </button>
      </form>

      <div className="mt-8 text-center">
        <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors">
          &larr; Back to sign in
        </Link>
      </div>
    </div>
  )
}
