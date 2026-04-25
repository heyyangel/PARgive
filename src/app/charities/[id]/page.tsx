import type { Metadata } from 'next'
import Image             from 'next/image'
import Link              from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getCharityById } from '@/actions/charities'
import DonatePanel        from '@/components/charities/DonatePanel'
import SetCharityButton   from '@/components/charities/SetCharityButton'
import type { Json }      from '@/lib/supabase/types'

interface PageProps {
  params:       { id: string }
  searchParams: { donated?: string; cancelled?: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const charity = await getCharityById(params.id)
  if (!charity) return { title: 'Charity Not Found — PARgive' }
  return {
    title:       `${charity.name} — PARgive Charities`,
    description: charity.description ?? `Support ${charity.name} through your PARgive subscription.`,
  }
}

type EventItem = { title: string; date: string; location: string }

function parseEvents(raw: Json): EventItem[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (e): e is EventItem =>
      typeof e === 'object' && e !== null &&
      'title' in e && 'date' in e && 'location' in e
  )
}

export default async function CharityProfilePage({ params, searchParams }: PageProps) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const charity = await getCharityById(params.id)
  if (!charity) notFound()

  // User's current charity selection
  const { data: userProfile } = await supabase
    .from('users')
    .select('charity_id')
    .eq('id', user.id)
    .single()

  const isCurrentCharity = userProfile?.charity_id === charity.id
  const events = parseEvents(charity.upcoming_events)

  return (
    <main className="min-h-screen bg-[#050508]">
      {/* ── Hero image ── */}
      <div className="relative w-full h-64 sm:h-80 overflow-hidden">
        {charity.image_url ? (
          <Image
            src={charity.image_url}
            alt={charity.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-900/40 to-indigo-900/40" />
        )}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/40 to-transparent" />

        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <Link
            href="/charities"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white text-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Charities
          </Link>
        </div>

        {charity.is_featured && (
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/80 backdrop-blur-sm text-white border border-violet-400/30">
              ⭐ Featured
            </span>
          </div>
        )}
      </div>

      {/* ── Banners ── */}
      {searchParams.donated && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-300 text-sm">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Thank you for your donation! Your generosity makes a real difference. 💚
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 -mt-12 pb-16">

        {/* ── Name + actions ── */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{charity.name}</h1>
            {isCurrentCharity && (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-emerald-300 text-sm">Your supported charity</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <SetCharityButton
              charityId={charity.id}
              charityName={charity.name}
              isCurrentCharity={isCurrentCharity}
            />
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">

          {/* ── Left: description + events ── */}
          <div className="space-y-8">
            {/* Description */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">About</h2>
              <p className="text-white/60 leading-relaxed text-sm">
                {charity.description ?? 'No description provided.'}
              </p>
            </section>

            {/* Upcoming events */}
            {events.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-white mb-4">
                  Upcoming Events
                  <span className="ml-2 text-xs font-normal text-white/30">Golf & fundraising</span>
                </h2>
                <div className="space-y-3">
                  {events.map((event, i) => {
                    const eventDate = new Date(event.date).toLocaleDateString('en-GB', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    })
                    const isPast = new Date(event.date) < new Date()
                    return (
                      <div
                        key={i}
                        className={`
                          p-4 rounded-xl border transition-all
                          ${isPast
                            ? 'bg-white/[0.02] border-white/5 opacity-50'
                            : 'bg-white/[0.04] border-white/10 hover:border-white/20'}
                        `}
                      >
                        <div className="flex items-start gap-4">
                          {/* Date block */}
                          <div className="flex-shrink-0 w-12 text-center">
                            <p className="text-xs text-white/30 uppercase">
                              {new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' })}
                            </p>
                            <p className="text-2xl font-bold text-white leading-none">
                              {new Date(event.date + 'T00:00:00').getDate()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{event.title}</p>
                            <p className="text-xs text-white/40 mt-0.5">
                              📍 {event.location}
                            </p>
                            {isPast && (
                              <span className="mt-1 inline-block text-xs text-white/25">Passed</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>

          {/* ── Right: donate panel ── */}
          <div className="sticky top-6">
            <DonatePanel charityId={charity.id} charityName={charity.name} />
          </div>
        </div>
      </div>
    </main>
  )
}
