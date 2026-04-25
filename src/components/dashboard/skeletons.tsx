/** Reusable animated skeleton primitives for all dashboard sections */
'use client'

const pulse = 'animate-pulse bg-white/[0.06] rounded-lg'

export function SkeletonLine({ w = 'w-full', h = 'h-3' }: { w?: string; h?: string }) {
  return <div className={`${pulse} ${w} ${h}`} />
}

export function SkeletonBlock({ h = 'h-20' }: { h?: string }) {
  return <div className={`${pulse} w-full ${h} rounded-xl`} />
}

// ─── Subscription Card ────────────────────────────────────────
export function SubscriptionSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
      <SkeletonLine w="w-32" h="h-3" />
      <div className="flex items-center gap-3">
        <SkeletonBlock h="h-8" />
        <SkeletonLine w="w-20" h="h-6" />
      </div>
      <SkeletonLine w="w-48" h="h-3" />
      <SkeletonLine w="w-36" h="h-3" />
      <SkeletonBlock h="h-10" />
    </div>
  )
}

// ─── Score Widget ─────────────────────────────────────────────
export function ScoreSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
      <SkeletonLine w="w-28" h="h-3" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <SkeletonLine w="w-12" h="h-8" />
          <SkeletonLine w="w-24" h="h-3" />
          <SkeletonLine w="w-16" h="h-5" />
          <div className="ml-auto flex gap-2">
            <SkeletonBlock h="h-7" />
          </div>
        </div>
      ))}
      <SkeletonBlock h="h-10" />
    </div>
  )
}

// ─── Charity Section ──────────────────────────────────────────
export function CharitySkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
      <SkeletonLine w="w-24" h="h-3" />
      <div className="flex items-center gap-3">
        <SkeletonBlock h="h-12" />
        <div className="space-y-2 flex-1">
          <SkeletonLine w="w-36" h="h-4" />
          <SkeletonLine w="w-24" h="h-3" />
        </div>
      </div>
      <SkeletonBlock h="h-16" />
      <SkeletonBlock h="h-10" />
    </div>
  )
}

// ─── Draw Summary ─────────────────────────────────────────────
export function DrawSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
      <SkeletonLine w="w-32" h="h-3" />
      <SkeletonBlock h="h-20" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex justify-between">
          <SkeletonLine w="w-24" h="h-3" />
          <SkeletonLine w="w-16" h="h-5" />
        </div>
      ))}
    </div>
  )
}

// ─── Winnings Overview ────────────────────────────────────────
export function WinningsSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
      <SkeletonLine w="w-36" h="h-3" />
      <SkeletonBlock h="h-16" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex justify-between items-center">
          <SkeletonLine w="w-20" h="h-3" />
          <SkeletonLine w="w-16" h="h-3" />
          <SkeletonLine w="w-12" h="h-5" />
        </div>
      ))}
    </div>
  )
}
