'use client'

import { useState }  from 'react'
import Link          from 'next/link'
import type { SubscriptionRow } from '@/lib/supabase/types'

type SubData = Pick<SubscriptionRow, 'plan' | 'status' | 'renewal_date'> | null

const STATUS_STYLES: Record<string, string> = {
  active:    'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  trialing:  'bg-sky-500/15 text-sky-300 border-sky-500/25',
  past_due:  'bg-amber-500/15 text-amber-300 border-amber-500/25',
  cancelled: 'bg-red-500/15 text-red-300 border-red-500/25',
  inactive:  'bg-white/10 text-white/40 border-white/10',
}

const PLAN_LABELS: Record<string, string> = {
  free:    'Free',
  basic:   'Monthly',
  premium: 'Yearly',
}

interface Props {
  subscription: SubData
  hasStripeId:  boolean
}

export default function SubscriptionPanel({ subscription, hasStripeId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const status   = subscription?.status  ?? 'inactive'
  const plan     = subscription?.plan    ?? 'free'
  const renewal  = subscription?.renewal_date
  const isActive = status === 'active' || status === 'trialing'

  async function openPortal() {
    setError(null)
    setLoading(true)
    try {
      const res  = await fetch('/api/stripe/create-portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Status row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">
            {PLAN_LABELS[plan]} Plan
          </p>
          {renewal && isActive && (
            <p className="text-xs text-white/40 mt-0.5">
              Renews {new Date(renewal).toLocaleDateString('en-US', {
                year: 'month', month: 'long', day: 'numeric',
              })}
            </p>
          )}
          {status === 'cancelled' && (
            <p className="text-xs text-red-400 mt-0.5">
              Access ends {renewal
                ? new Date(renewal).toLocaleDateString()
                : 'soon'}
            </p>
          )}
          {status === 'past_due' && (
            <p className="text-xs text-amber-400 mt-0.5">
              Payment failed — please update your billing details
            </p>
          )}
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[status] ?? STATUS_STYLES.inactive}`}>
          {status.replace('_', ' ')}
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {isActive && hasStripeId ? (
          <button
            id="manage-billing"
            onClick={openPortal}
            disabled={loading}
            className="
              px-5 py-2.5 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-r from-violet-600 to-indigo-600
              hover:from-violet-500 hover:to-indigo-500
              disabled:opacity-50 transition-all duration-200
            "
          >
            {loading ? 'Redirecting…' : 'Manage billing'}
          </button>
        ) : (
          <Link
            href="/subscribe"
            id="upgrade-plan"
            className="
              px-5 py-2.5 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-r from-violet-600 to-indigo-600
              hover:from-violet-500 hover:to-indigo-500
              transition-all duration-200
            "
          >
            {status === 'cancelled' ? 'Resubscribe' : 'Upgrade plan'}
          </Link>
        )}
      </div>

      <p className="text-white/30 text-xs">
        Billing is managed securely by Stripe. We never store your card details.
      </p>
    </div>
  )
}
