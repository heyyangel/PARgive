'use client'

import { useState, useMemo } from 'react'
import Image                 from 'next/image'
import Link                  from 'next/link'
import { updateUserCharityAction } from '@/actions/charities'
import type { CharityRow }   from '@/lib/supabase/types'

type FilterOption = 'all' | 'featured' | 'selected'

interface Props {
  charities:        CharityRow[]
  currentCharityId: string | null
}

export default function CharitySearch({ charities, currentCharityId }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterOption>('all')
  const [saving, setSaving] = useState<string | null>(null)
  const [toast,  setToast]  = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = charities

    if (filter === 'featured') {
      result = result.filter((c) => c.is_featured)
    } else if (filter === 'selected') {
      result = result.filter((c) => c.id === currentCharityId)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description ?? '').toLowerCase().includes(q)
      )
    }
    return result
  }, [charities, filter, search, currentCharityId])

  async function handleSelect(charityId: string) {
    setSaving(charityId)
    const formData = new FormData()
    formData.set('charity_id', charityId)
    const result = await updateUserCharityAction(formData)
    setSaving(null)

    if (result?.error) {
      setToast(`Error: ${result.error}`)
    } else {
      setToast('Charity updated! Your subscription will now support this organisation.')
    }
    setTimeout(() => setToast(null), 4000)
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm shadow-2xl">
          {toast}
        </div>
      )}

      {/* ── Search + filter bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="charity-search"
            type="text"
            placeholder="Search charities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/25
              bg-white/5 border border-white/10
              focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40
              transition-all duration-200
            "
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          {([ 'all', 'featured', 'selected'] as FilterOption[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all duration-200
                ${filter === f
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20'}
              `}
            >
              {f === 'selected' ? 'My Charity' : f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results count ── */}
      <p className="text-white/30 text-xs mb-6">
        {filtered.length} {filtered.length === 1 ? 'charity' : 'charities'} found
        {search ? ` matching "${search}"` : ''}
      </p>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="text-white/40 text-sm">No charities found</p>
          <p className="text-white/25 text-xs mt-1">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((charity) => {
            const isSelected = charity.id === currentCharityId
            const isSaving   = saving === charity.id

            return (
              <div
                key={charity.id}
                className={`
                  group relative flex flex-col rounded-2xl overflow-hidden
                  border transition-all duration-300
                  ${isSelected
                    ? 'border-emerald-500/40 shadow-lg shadow-emerald-900/20'
                    : 'border-white/10 hover:border-white/20'}
                  bg-white/[0.03] hover:bg-white/[0.05]
                `}
              >
                {/* Image */}
                <div className="relative h-44 bg-gradient-to-br from-violet-900/30 to-indigo-900/30">
                  {charity.image_url && (
                    <Image
                      src={charity.image_url}
                      alt={charity.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/80 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {charity.is_featured && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-500/80 backdrop-blur-sm text-white border border-violet-400/30">
                        ⭐ Featured
                      </span>
                    )}
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/80 backdrop-blur-sm text-white border border-emerald-400/30">
                        ✓ My Charity
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-5">
                  <h3 className="text-base font-semibold text-white mb-2 leading-snug">
                    {charity.name}
                  </h3>
                  {charity.description && (
                    <p className="text-white/50 text-xs leading-relaxed flex-1 line-clamp-3">
                      {charity.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Link
                      href={`/charities/${charity.id}`}
                      className="
                        flex-1 py-2 rounded-xl text-xs font-medium text-center text-white/70
                        bg-white/5 border border-white/10
                        hover:bg-white/10 hover:text-white
                        transition-all duration-200
                      "
                    >
                      View profile
                    </Link>

                    {isSelected ? (
                      <button
                        disabled
                        className="flex-1 py-2 rounded-xl text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 cursor-default"
                      >
                        ✓ Selected
                      </button>
                    ) : (
                      <button
                        id={`select-charity-${charity.id}`}
                        onClick={() => handleSelect(charity.id)}
                        disabled={!!saving}
                        className="
                          flex-1 py-2 rounded-xl text-xs font-semibold text-white
                          bg-gradient-to-r from-violet-600 to-indigo-600
                          hover:from-violet-500 hover:to-indigo-500
                          disabled:opacity-50 transition-all duration-200
                          flex items-center justify-center gap-1.5
                        "
                      >
                        {isSaving ? (
                          <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving…</>
                        ) : 'Support this'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
