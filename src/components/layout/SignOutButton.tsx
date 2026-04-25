'use client'

import { signOutAction } from '@/actions/auth'

export default function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
        title="Sign out"
      >
        <span className="hidden sm:inline">Sign out</span>
        <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </form>
  )
}
