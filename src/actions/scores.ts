'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { ScoreRow } from '@/lib/supabase/types'

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const MAX_SCORES = 5
const MIN_SCORE  = 1
const MAX_SCORE  = 45

// ─────────────────────────────────────────────────────────────
// VALIDATION HELPER
// ─────────────────────────────────────────────────────────────
function validateScoreInput(
  rawValue: string,
  rawDate:  string
): { error: string } | { scoreValue: number; scoreDate: string } {
  // Score value
  const scoreValue = Number(rawValue)
  if (!rawValue || isNaN(scoreValue) || !Number.isInteger(scoreValue)) {
    return { error: 'Score must be a whole number.' }
  }
  if (scoreValue < MIN_SCORE || scoreValue > MAX_SCORE) {
    return { error: `Score must be between ${MIN_SCORE} and ${MAX_SCORE} (Stableford range).` }
  }

  // Date
  if (!rawDate) {
    return { error: 'A round date is required.' }
  }
  const inputDate = new Date(rawDate)
  if (isNaN(inputDate.getTime())) {
    return { error: 'Invalid date.' }
  }
  // No future dates — compare calendar dates, not timestamps
  const todayStr = new Date().toISOString().split('T')[0]
  if (rawDate > todayStr) {
    return { error: 'Score date cannot be in the future.' }
  }

  return { scoreValue, scoreDate: rawDate }
}

// ─────────────────────────────────────────────────────────────
// FETCH SCORES (server — call from Server Components)
// ─────────────────────────────────────────────────────────────
export async function getScores(): Promise<ScoreRow[]> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', user.id)
    .order('score_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(MAX_SCORES)

  if (error) {
    console.error('[getScores]', error)
    return []
  }
  return data ?? []
}

// ─────────────────────────────────────────────────────────────
// ADD SCORE
// ─────────────────────────────────────────────────────────────
export async function addScoreAction(formData: FormData) {
  const validated = validateScoreInput(
    formData.get('score_value') as string,
    formData.get('score_date')  as string
  )
  if ('error' in validated) return { error: validated.error }
  const { scoreValue, scoreDate } = validated

  const supabase = await getSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated.' }

  // ── Count existing scores ──────────────────────────────────
  const { count, error: countError } = await supabase
    .from('scores')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (countError) return { error: countError.message }

  // ── If at limit: delete the oldest before inserting ────────
  if ((count ?? 0) >= MAX_SCORES) {
    const { data: oldest, error: fetchError } = await supabase
      .from('scores')
      .select('id, score_date, score_value')
      .eq('user_id', user.id)
      .order('score_date', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (fetchError || !oldest) {
      return { error: 'Could not determine oldest score to replace.' }
    }

    const { error: deleteError } = await supabase
      .from('scores')
      .delete()
      .eq('id', oldest.id)
      .eq('user_id', user.id)   // extra safety — RLS + ownership check

    if (deleteError) return { error: deleteError.message }
  }

  // ── Insert new score ───────────────────────────────────────
  const { error: insertError } = await supabase.from('scores').insert({
    user_id:     user.id,
    score_value: scoreValue,
    score_date:  scoreDate,
  })

  if (insertError) return { error: insertError.message }

  revalidatePath('/scores')
  const wasReplacement = (count ?? 0) >= MAX_SCORES
  return {
    success: wasReplacement
      ? 'Score added. Your oldest round was removed to stay within the 5-score limit.'
      : 'Score added successfully.',
  }
}

// ─────────────────────────────────────────────────────────────
// UPDATE SCORE
// ─────────────────────────────────────────────────────────────
export async function updateScoreAction(formData: FormData) {
  const id = formData.get('id') as string
  if (!id) return { error: 'Missing score ID.' }

  const validated = validateScoreInput(
    formData.get('score_value') as string,
    formData.get('score_date')  as string
  )
  if ('error' in validated) return { error: validated.error }
  const { scoreValue, scoreDate } = validated

  const supabase = await getSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('scores')
    .update({ score_value: scoreValue, score_date: scoreDate })
    .eq('id', id)
    .eq('user_id', user.id)   // user can only edit their own

  if (error) return { error: error.message }

  revalidatePath('/scores')
  return { success: 'Score updated.' }
}

// ─────────────────────────────────────────────────────────────
// DELETE SCORE
// ─────────────────────────────────────────────────────────────
export async function deleteScoreAction(id: string) {
  if (!id) return { error: 'Missing score ID.' }

  const supabase = await getSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('scores')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/scores')
  return { success: 'Score removed.' }
}

