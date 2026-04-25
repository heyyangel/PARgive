'use server'

import { revalidatePath }         from 'next/cache'
import { assertAdmin, getAdmin }  from '@/lib/admin-guard'
import type { SubscriptionStatus, SubscriptionPlan } from '@/lib/supabase/types'

// ─────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────
export async function adminGetUsers(search = '') {
  const denied = await assertAdmin()
  if (denied) return { error: denied, data: [] }
  const admin = getAdmin()

  let q = admin
    .from('users')
    .select('id, email, name, subscription_status, subscription_plan, subscription_start, created_at, charity_percentage')
    .order('created_at', { ascending: false })
    .limit(100)

  if (search.trim()) {
    q = q.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
  }
  const { data, error } = await q
  return { data: data ?? [], error: error?.message }
}

export async function adminUpdateUserSubscription(formData: FormData) {
  const denied = await assertAdmin()
  if (denied) return { error: denied }
  const admin  = getAdmin()

  const userId = formData.get('user_id') as string
  const status = formData.get('subscription_status') as SubscriptionStatus
  const plan   = formData.get('subscription_plan')   as SubscriptionPlan

  const { error } = await admin
    .from('users')
    .update({ subscription_status: status, subscription_plan: plan })
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return { success: 'User subscription updated.' }
}

export async function adminGetUserScores(userId: string) {
  const denied = await assertAdmin()
  if (denied) return { error: denied, data: [] }
  const admin = getAdmin()

  const { data } = await admin
    .from('scores')
    .select('id, score_value, score_date')
    .eq('user_id', userId)
    .order('score_date', { ascending: false })
  return { data: data ?? [] }
}

// ─────────────────────────────────────────────────────────────
// CHARITIES
// ─────────────────────────────────────────────────────────────
export async function adminGetCharities() {
  const denied = await assertAdmin()
  if (denied) return { error: denied, data: [] }
  const admin = getAdmin()

  const { data } = await admin
    .from('charities')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('name',        { ascending: true })
  return { data: data ?? [] }
}

export async function adminCreateCharity(formData: FormData) {
  const denied = await assertAdmin()
  if (denied) return { error: denied }
  const admin = getAdmin()

  const name        = (formData.get('name')        as string).trim()
  const description = (formData.get('description') as string).trim() || null
  const image_url   = (formData.get('image_url')   as string).trim() || null
  const is_featured = formData.get('is_featured') === 'true'

  if (!name) return { error: 'Name is required.' }

  const { error } = await admin.from('charities').insert({
    name, description, image_url, is_featured, upcoming_events: [],
  })
  if (error) return { error: error.message }
  revalidatePath('/admin/charities')
  revalidatePath('/charities')
  return { success: `Charity "${name}" created.` }
}

export async function adminUpdateCharity(formData: FormData) {
  const denied = await assertAdmin()
  if (denied) return { error: denied }
  const admin = getAdmin()

  const id          = formData.get('id')          as string
  const name        = (formData.get('name')        as string).trim()
  const description = (formData.get('description') as string).trim() || null
  const image_url   = (formData.get('image_url')   as string).trim() || null
  const is_featured = formData.get('is_featured') === 'true'

  if (!id || !name) return { error: 'ID and name are required.' }

  const { error } = await admin
    .from('charities')
    .update({ name, description, image_url, is_featured })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/charities')
  revalidatePath('/charities')
  return { success: 'Charity updated.' }
}

export async function adminDeleteCharity(id: string) {
  const denied = await assertAdmin()
  if (denied) return { error: denied }
  const admin = getAdmin()

  const { error } = await admin.from('charities').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/charities')
  revalidatePath('/charities')
  return { success: 'Charity deleted.' }
}

export async function adminToggleFeatured(id: string, featured: boolean) {
  const denied = await assertAdmin()
  if (denied) return { error: denied }
  const admin = getAdmin()

  // Un-feature all others first if featuring this one
  if (featured) {
    await admin.from('charities').update({ is_featured: false }).neq('id', id)
  }
  const { error } = await admin.from('charities').update({ is_featured: featured }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/charities')
  return { success: featured ? 'Set as featured.' : 'Removed from featured.' }
}

export async function adminUpsertEvent(formData: FormData) {
  const denied = await assertAdmin()
  if (denied) return { error: denied }
  const admin = getAdmin()

  const charityId = formData.get('charity_id') as string
  const title     = (formData.get('title')    as string).trim()
  const date      = formData.get('date')       as string
  const location  = (formData.get('location') as string).trim()

  if (!charityId || !title || !date) return { error: 'Title, date, and charity are required.' }

  const { data: charity } = await admin
    .from('charities')
    .select('upcoming_events')
    .eq('id', charityId)
    .single()

  const events = Array.isArray(charity?.upcoming_events) ? charity.upcoming_events : []
  events.push({ title, date, location })
  events.sort((a: any, b: any) => a.date.localeCompare(b.date))

  const { error } = await admin
    .from('charities')
    .update({ upcoming_events: events })
    .eq('id', charityId)

  if (error) return { error: error.message }
  revalidatePath('/admin/charities')
  revalidatePath(`/charities/${charityId}`)
  return { success: 'Event added.' }
}

// ─────────────────────────────────────────────────────────────
// WINNERS
// ─────────────────────────────────────────────────────────────
export async function adminGetWinners(filters?: {
  drawId?: string
  tier?:   string
  payout?: string
}) {
  const denied = await assertAdmin()
  if (denied) return { error: denied, data: [] }
  const admin = getAdmin()

  let q = admin
    .from('winners')
    .select(`
      id, tier, amount, payout_status, verification_status, proof_url, created_at,
      user:users(email, name),
      draw:draws(month, year)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  if (filters?.drawId) q = q.eq('draw_id', filters.drawId)
  if (filters?.tier)   q = q.eq('tier', filters.tier)
  if (filters?.payout) q = q.eq('payout_status', filters.payout)

  const { data, error } = await q
  return { data: data ?? [], error: error?.message }
}

export async function adminUpdateWinner(formData: FormData) {
  const denied = await assertAdmin()
  if (denied) return { error: denied }
  const admin = getAdmin()

  const id                  = formData.get('id')                  as string
  const verification_status = formData.get('verification_status') as string | null
  const payout_status       = formData.get('payout_status')       as string | null

  if (!id) return { error: 'Winner ID required.' }

  const updates: Record<string, string> = {}
  if (verification_status) updates.verification_status = verification_status
  if (payout_status)       updates.payout_status       = payout_status

  const { error } = await admin.from('winners').update(updates).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/winners')
  return { success: 'Winner record updated.' }
}

// ─────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────
export async function adminGetAnalytics() {
  const denied = await assertAdmin()
  if (denied) return null
  const admin = getAdmin()

  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  const [
    { count: activeCount },
    { count: totalUsers },
    { data:  currentDraw },
    { count: entryCount },
    { data:  draws },
  ] = await Promise.all([
    admin.from('users').select('*', { count: 'exact', head: true }).in('subscription_status', ['active', 'trialing']),
    admin.from('users').select('*', { count: 'exact', head: true }),
    admin.from('draws').select('id').eq('month', month).eq('year', year).maybeSingle(),
    admin.from('draw_entries').select('*', { count: 'exact', head: true }),
    admin.from('draws').select('id, status, month, year').order('year', { ascending: false }).order('month', { ascending: false }).limit(12),
  ])

  // This month's prize pool
  const { data: prizePool } = currentDraw?.id
    ? await admin.from('prize_pools').select('*').eq('draw_id', currentDraw.id).single()
    : { data: null }

  const thisMonthPool = (activeCount ?? 0) * 5   // £5 per subscriber

  // Participation rate: entries this month / active subscribers
  const { count: monthEntries } = currentDraw?.id
    ? await admin.from('draw_entries').select('*', { count: 'exact', head: true }).eq('draw_id', currentDraw.id)
    : { count: 0 }

  const participationRate = activeCount && activeCount > 0
    ? Math.round(((monthEntries ?? 0) / activeCount) * 100)
    : 0

  return {
    activeSubscribers:  activeCount  ?? 0,
    totalUsers:         totalUsers   ?? 0,
    thisMonthPool,
    jackpotCarry:       prizePool?.jackpot_carry ?? 0,
    participationRate,
    totalDraws:         (draws ?? []).length,
    totalEntries:       entryCount ?? 0,
    draws:              draws ?? [],
  }
}
