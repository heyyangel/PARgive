'use client'

import { useState, useTransition } from 'react'
import { useRouter }               from 'next/navigation'
import type { PLANS }              from '@/lib/stripe'

const CHECK_ICON = (
  <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
)

interface Props {
  plans:           typeof PLANS
  isAuthenticated: boolean
}

export default function PricingSection({ plans, isAuthenticated }: Props) {
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error,       setError]       = useState<string | null>(null)

  async function handleSubscribe(planKey: 'basic' | 'premium') {
    if (!isAuthenticated) {
      router.push('/signup')
      return
    }

    setError(null)
    setLoadingPlan(planKey)

    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ planKey }),
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Failed to create checkout session')
      }

      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setLoadingPlan(null)
    }
  }

  const monthlyPrice = (plans.basic.amount   / 100).toFixed(2)
  const yearlyPrice  = (plans.premium.amount / 100).toFixed(2)
  const yearlyMonthlyEquiv = (plans.premium.amount / 100 / 12).toFixed(2)
  const savingsPct = Math.round(
    (1 - plans.premium.amount / (plans.basic.amount * 12)) * 100
  )

  return (
    <>
      {error && (
        <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* ── Monthly Card ── */}
        <div className="
          relative p-8 rounded-2xl
          bg-white/[0.04] border border-white/10
          hover:border-white/20 hover:bg-white/[0.06]
          transition-all duration-300
        ">
          <div className="mb-6">
            <p className="text-sm font-medium text-white/50 uppercase tracking-widest mb-1">
              {plans.basic.name}
            </p>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-white">${monthlyPrice}</span>
              <span className="text-white/40 text-sm mb-1.5">/month</span>
            </div>
            <p className="text-white/40 text-sm mt-1">{plans.basic.description}</p>
          </div>

          <ul className="space-y-3 mb-8">
            {plans.basic.features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-white/70">
                {CHECK_ICON}
                {f}
              </li>
            ))}
          </ul>

          <button
            id="subscribe-monthly"
            onClick={() => handleSubscribe('basic')}
            disabled={!!loadingPlan}
            className="
              w-full py-3 rounded-xl font-semibold text-sm text-white
              bg-white/10 border border-white/15
              hover:bg-white/15 hover:border-white/25
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              flex items-center justify-center gap-2
            "
          >
            {loadingPlan === 'basic' ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirecting…
              </>
            ) : isAuthenticated ? 'Start monthly plan' : 'Get started'}
          </button>
        </div>

        {/* ── Yearly Card (Featured) ── */}
        <div className="
          relative p-8 rounded-2xl
          bg-gradient-to-b from-violet-600/20 to-indigo-600/10
          border border-violet-500/30
          hover:border-violet-400/50
          transition-all duration-300
          shadow-xl shadow-violet-900/20
        ">
          {/* Best Value badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="px-4 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg">
              Save {savingsPct}% · Best Value
            </span>
          </div>

          <div className="mb-6">
            <p className="text-sm font-medium text-violet-300 uppercase tracking-widest mb-1">
              {plans.premium.name}
            </p>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-white">${yearlyPrice}</span>
              <span className="text-white/40 text-sm mb-1.5">/year</span>
            </div>
            <p className="text-violet-300/60 text-sm mt-1">
              Just ${yearlyMonthlyEquiv}/mo · {plans.premium.description}
            </p>
          </div>

          <ul className="space-y-3 mb-8">
            {plans.premium.features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-white/80">
                {CHECK_ICON}
                {f}
              </li>
            ))}
          </ul>

          <button
            id="subscribe-yearly"
            onClick={() => handleSubscribe('premium')}
            disabled={!!loadingPlan}
            className="
              w-full py-3 rounded-xl font-semibold text-sm text-white
              bg-gradient-to-r from-violet-600 to-indigo-600
              hover:from-violet-500 hover:to-indigo-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 shadow-lg shadow-violet-900/40
              flex items-center justify-center gap-2
            "
          >
            {loadingPlan === 'premium' ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirecting…
              </>
            ) : isAuthenticated ? 'Start yearly plan' : 'Get started'}
          </button>
        </div>
      </div>
    </>
  )
}
