'use client'

import { useState, useTransition } from 'react'
import { adminGetUsers, adminUpdateUserSubscription, adminGetUserScores } from '@/actions/admin'
import type { SubscriptionStatus, SubscriptionPlan } from '@/lib/supabase/types'

type UserRow = {
  id: string; email: string; name: string | null
  subscription_status: string; subscription_plan: string
  subscription_start: string | null; created_at: string
  charity_percentage: number
}

const STATUS_OPTS: SubscriptionStatus[] = ['active','inactive','cancelled','past_due','trialing']
const PLAN_OPTS:   SubscriptionPlan[]   = ['free','basic','premium']

const STATUS_BADGE: Record<string, string> = {
  active:    'bg-emerald-500/15 border-emerald-500/25 text-emerald-300',
  trialing:  'bg-sky-500/15 border-sky-500/25 text-sky-300',
  past_due:  'bg-amber-500/15 border-amber-500/25 text-amber-300',
  cancelled: 'bg-red-500/15 border-red-500/25 text-red-300',
  inactive:  'bg-white/8 border-white/10 text-white/40',
}

function ScoreModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [scores, setScores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useState(() => {
    adminGetUserScores(userId).then(({ data }) => { setScores(data); setLoading(false) })
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0d0d14] border border-white/15 rounded-2xl p-6 w-80" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold">User Scores</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>
        {loading ? <p className="text-white/40 text-sm">Loading…</p> : scores.length === 0 ? (
          <p className="text-white/30 text-sm">No scores recorded.</p>
        ) : (
          <div className="space-y-2">
            {scores.map((s) => (
              <div key={s.id} className="flex justify-between text-sm">
                <span className="text-white font-semibold">{s.score_value} pts</span>
                <span className="text-white/40">{s.score_date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EditModal({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await adminUpdateUserSubscription(fd)
      setMsg(r.error ?? r.success ?? null)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0d0d14] border border-white/15 rounded-2xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-white font-semibold">Edit Subscription</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>
        <p className="text-white/40 text-xs mb-4">{user.email}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="user_id" value={user.id} />
          <div>
            <label className="block text-xs text-white/40 mb-1">Status</label>
            <select name="subscription_status" defaultValue={user.subscription_status}
              className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/40 [color-scheme:dark]">
              {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Plan</label>
            <select name="subscription_plan" defaultValue={user.subscription_plan}
              className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/40 [color-scheme:dark]">
              {PLAN_OPTS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {msg && <p className={`text-xs ${msg.includes('updated') ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</p>}
          <button type="submit" disabled={isPending}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all">
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [users,    setUsers]    = useState<UserRow[]>([])
  const [search,   setSearch]   = useState('')
  const [loaded,   setLoaded]   = useState(false)
  const [editing,  setEditing]  = useState<UserRow | null>(null)
  const [viewing,  setViewing]  = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function load(q = '') {
    startTransition(async () => {
      const { data } = await adminGetUsers(q)
      setUsers(data as UserRow[])
      setLoaded(true)
    })
  }

  useState(() => { load() })

  return (
    <div className="space-y-6">
      {editing  && <EditModal  user={editing}   onClose={() => { setEditing(null);  load(search) }} />}
      {viewing  && <ScoreModal userId={viewing} onClose={() => setViewing(null)} />}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Users</h1>
          <p className="text-white/40 text-sm mt-0.5">{users.length} users loaded</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text" placeholder="Search email or name…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(search)}
            className="px-3 py-2 rounded-xl text-sm text-white placeholder:text-white/25 bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/40 w-56"
          />
          <button onClick={() => load(search)} disabled={isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-all">
            {isPending ? '…' : 'Search'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-white/[0.02]">
              {['Email', 'Name', 'Status', 'Plan', 'Charity %', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loaded && (
              <tr><td colSpan={7} className="text-center py-12 text-white/30">Loading users…</td></tr>
            )}
            {loaded && users.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-white/30">No users found</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/80 text-xs font-mono">{u.email}</td>
                <td className="px-4 py-3 text-white/60">{u.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_BADGE[u.subscription_status] ?? STATUS_BADGE.inactive}`}>
                    {u.subscription_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/50 capitalize">{u.subscription_plan}</td>
                <td className="px-4 py-3 text-white/50">{u.charity_percentage}%</td>
                <td className="px-4 py-3 text-white/30 text-xs whitespace-nowrap">
                  {new Date(u.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(u)}
                      className="px-2.5 py-1 rounded-lg text-xs text-white/60 bg-white/5 hover:bg-white/10 hover:text-white transition-all">
                      Edit
                    </button>
                    <button onClick={() => setViewing(u.id)}
                      className="px-2.5 py-1 rounded-lg text-xs text-white/60 bg-white/5 hover:bg-white/10 hover:text-white transition-all">
                      Scores
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
