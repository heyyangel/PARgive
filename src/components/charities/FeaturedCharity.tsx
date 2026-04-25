import Image from 'next/image'
import Link  from 'next/link'
import type { CharityRow } from '@/lib/supabase/types'

interface Props {
  charity:            CharityRow
  userContribution?:  { amount: number; period: string } | null
}

export default function FeaturedCharity({ charity, userContribution }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-900/20 to-indigo-900/10">

      {/* Background image with overlay */}
      {charity.image_url && (
        <div className="absolute inset-0 opacity-20">
          <Image
            src={charity.image_url}
            alt=""
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050508] via-[#050508]/80 to-transparent" />
        </div>
      )}

      {/* Glowing orb */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl" />

      <div className="relative z-10 p-8 sm:p-10">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/20 border border-violet-500/30 text-violet-300">
            ⭐ Charity Spotlight
          </span>
          <span className="text-white/30 text-xs">Featured this month</span>
        </div>

        <div className="max-w-xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-snug">
            {charity.name}
          </h2>
          <p className="text-white/55 text-sm leading-relaxed mb-6">
            {charity.description}
          </p>

          {/* Impact statement */}
          {userContribution && userContribution.amount > 0 && (
            <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 inline-flex">
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p className="text-emerald-300 text-sm">
                You contribute{' '}
                <strong>£{userContribution.amount.toFixed(2)}</strong>{' '}
                per {userContribution.period} to this charity
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/charities/${charity.id}`}
              className="
                px-6 py-2.5 rounded-xl font-semibold text-sm text-white
                bg-gradient-to-r from-violet-600 to-indigo-600
                hover:from-violet-500 hover:to-indigo-500
                transition-all duration-200 shadow-lg shadow-violet-900/30
              "
            >
              Learn more →
            </Link>
            <Link
              href="/charities"
              className="
                px-6 py-2.5 rounded-xl font-medium text-sm text-white/60
                bg-white/5 border border-white/10
                hover:bg-white/10 hover:text-white
                transition-all duration-200
              "
            >
              Browse all charities
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
