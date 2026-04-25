import type { Metadata } from 'next'
import { redirect }      from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getCharities }  from '@/actions/charities'
import CharitySearch     from '@/components/charities/CharitySearch'

export const metadata: Metadata = {
  title:       'Charity Directory — PARgive',
  description: 'Browse all supported charities. Every subscription contributes to a cause you love.',
}

export default async function CharitiesPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user's current charity selection
  const { data: userProfile } = await supabase
    .from('users')
    .select('charity_id')
    .eq('id', user.id)
    .single()

  const charities = await getCharities()

  return (
    <main className="min-h-screen bg-[#050508]">
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 35% at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 65%),' +
            'radial-gradient(ellipse 40% 25% at 80% 80%, rgba(109,40,217,0.06) 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Header ── */}
        <div className="mb-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Charity Directory</h1>
              <p className="text-white/40 text-sm mt-1">
                {charities.length} organisation{charities.length !== 1 ? 's' : ''} supported ·
                Your subscription contributes to the charity you choose
              </p>
            </div>

            {userProfile?.charity_id && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 text-xs font-medium">You're supporting a charity</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Search + grid (client component handles filtering) ── */}
        <CharitySearch
          charities={charities}
          currentCharityId={userProfile?.charity_id ?? null}
        />
      </div>
    </main>
  )
}
