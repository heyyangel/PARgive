import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'

import SubscriptionCard from '@/components/dashboard/SubscriptionCard'
import ScoreWidget from '@/components/dashboard/ScoreWidget'
import CharitySection from '@/components/dashboard/CharitySection'
import DrawSummary from '@/components/dashboard/DrawSummary'
import WinningsOverview from '@/components/dashboard/WinningsOverview'

import {
  SubscriptionSkeleton,
  ScoreSkeleton,
  CharitySkeleton,
  DrawSkeleton,
  WinningsSkeleton,
} from '@/components/dashboard/skeletons'

export const metadata: Metadata = {
  title: 'Dashboard — PARgive',
  description: 'Your personal PARgive dashboard.',
}

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  // Minimal profile for the greeting — fast cookie-based read
  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  const firstName = (profile?.name ?? user.email ?? 'there').split(' ')[0]
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <main className="relative">
      {/* Ambient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 55% 30% at 50% 0%, rgba(109,40,217,0.1) 0%, transparent 65%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Page header ── */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-white/40 text-sm">{greeting}</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">{firstName} 👋</h1>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/40 text-xs">
              {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>

        {/* ── Layout grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Row 1 col 1: Subscription */}
          <Suspense fallback={<SubscriptionSkeleton />}>
            <SubscriptionCard userId={user.id} />
          </Suspense>

          {/* Row 1 col 2: Charity */}
          <Suspense fallback={<CharitySkeleton />}>
            <CharitySection userId={user.id} />
          </Suspense>

          {/* Row 2: Scores — full width */}
          <div className="lg:col-span-2">
            <Suspense fallback={<ScoreSkeleton />}>
              <ScoreWidget userId={user.id} />
            </Suspense>
          </div>

          {/* Row 3 col 1: Draw Summary */}
          <Suspense fallback={<DrawSkeleton />}>
            <DrawSummary userId={user.id} />
          </Suspense>

          {/* Row 3 col 2: Winnings */}
          <Suspense fallback={<WinningsSkeleton />}>
            <WinningsOverview userId={user.id} />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
