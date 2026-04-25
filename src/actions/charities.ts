'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import type { CharityRow } from '@/lib/supabase/types'

// ─────────────────────────────────────────────────────────────
// READ — ALL CHARITIES (with optional name search)
// ─────────────────────────────────────────────────────────────
export async function getCharities(search?: string): Promise<CharityRow[]> {
  const supabase = await getSupabaseServerClient()

  let query = supabase
    .from('charities')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('name',        { ascending: true })

  if (search && search.trim().length > 0) {
    // Case-insensitive ILIKE search on name and description
    query = query.or(
      `name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`
    )
  }

  const { data, error } = await query

  if (error) {
    console.error('[getCharities]', error)
    return []
  }
  return data ?? []
}

// ─────────────────────────────────────────────────────────────
// READ — FEATURED CHARITY (for homepage spotlight)
// ─────────────────────────────────────────────────────────────
export async function getFeaturedCharity(): Promise<CharityRow | null> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('charities')
    .select('*')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[getFeaturedCharity]', error)
    return null
  }
  return data
}

// ─────────────────────────────────────────────────────────────
// READ — SINGLE CHARITY BY ID
// ─────────────────────────────────────────────────────────────
export async function getCharityById(id: string): Promise<CharityRow | null> {
  if (!id) return null

  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('charities')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[getCharityById]', error)
    return null
  }
  return data
}

// ─────────────────────────────────────────────────────────────
// READ — USER'S SELECTED CHARITY
// ─────────────────────────────────────────────────────────────
export async function getUserCharitySettings() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('charity_id, charity_percentage, subscription_plan')
    .eq('id', user.id)
    .single()

  return data ?? null
}

// ─────────────────────────────────────────────────────────────
// WRITE — UPDATE USER'S SELECTED CHARITY
// ─────────────────────────────────────────────────────────────
export async function updateUserCharityAction(formData: FormData) {
  const charityId = formData.get('charity_id') as string | null

  const supabase = await getSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated.' }

  // Validate charity exists (if a non-null value was passed)
  if (charityId) {
    const { data: charity, error: charityError } = await supabase
      .from('charities')
      .select('id')
      .eq('id', charityId)
      .single()

    if (charityError || !charity) {
      return { error: 'Selected charity not found.' }
    }
  }

  const { error } = await supabase
    .from('users')
    .update({ charity_id: charityId ?? null })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/account/settings')
  revalidatePath('/charities')
  return { success: 'Charity updated.' }
}

// ─────────────────────────────────────────────────────────────
// WRITE — UPDATE CONTRIBUTION PERCENTAGE (minimum 10%)
// ─────────────────────────────────────────────────────────────
export async function updateContributionPercentageAction(formData: FormData) {
  const raw = formData.get('charity_percentage')
  const pct = Number(raw)

  if (!raw || isNaN(pct) || !Number.isInteger(pct)) {
    return { error: 'Percentage must be a whole number.' }
  }
  if (pct < 10) {
    return { error: 'Contribution cannot be reduced below 10%.' }
  }
  if (pct > 100) {
    return { error: 'Contribution cannot exceed 100%.' }
  }

  const supabase = await getSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated.' }

  // Double-check server-side that they're not going below current value
  const { data: current } = await supabase
    .from('users')
    .select('charity_percentage')
    .eq('id', user.id)
    .single()

  if ((current?.charity_percentage ?? 10) > pct) {
    return { error: `You cannot reduce your contribution below your current rate of ${current?.charity_percentage ?? 10}%.` }
  }

  const { error } = await supabase
    .from('users')
    .update({ charity_percentage: pct })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/account/settings')
  return { success: `Contribution updated to ${pct}%.` }
}

// ─────────────────────────────────────────────────────────────
// STRIPE — CREATE ONE-TIME DONATION SESSION
// ─────────────────────────────────────────────────────────────
export async function createDonationSessionAction(formData: FormData) {
  const charityId   = formData.get('charity_id')   as string
  const charityName = formData.get('charity_name')  as string
  const rawAmount   = formData.get('amount')        as string

  const amountPounds = parseFloat(rawAmount)
  if (isNaN(amountPounds) || amountPounds < 1) {
    return { error: 'Minimum donation is £1.00.' }
  }
  if (amountPounds > 10000) {
    return { error: 'Maximum single donation is £10,000.' }
  }

  const amountPence = Math.round(amountPounds * 100)

  try {
    const session = await stripe.checkout.sessions.create({
      mode:                 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency:     'gbp',
            unit_amount:  amountPence,
            product_data: {
              name:        `Donation to ${charityName}`,
              description: `One-time charitable donation`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/charities/${charityId}?donated=true`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/charities/${charityId}?cancelled=true`,
      metadata: {
        type:        'donation',
        charity_id:  charityId,
        charity_name: charityName,
      },
    })

    return { url: session.url }
  } catch (err: any) {
    console.error('[createDonationSession]', err)
    return { error: err.message }
  }
}
