/**
 * Admin guard — call at the top of every admin server component / action.
 * Redirects non-admins to /dashboard.
 */
import { redirect }               from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient }  from '@/lib/supabase/server'

export async function requireAdminUser() {
  const supabase = await getSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user)                             redirect('/login')
  if (user.user_metadata?.role !== 'admin')       redirect('/dashboard')
  return user
}

/** Lightweight check for server actions (returns error string instead of redirect) */
export async function assertAdmin(): Promise<string | null> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user)                               return 'Unauthenticated.'
  if (user.user_metadata?.role !== 'admin') return 'Forbidden.'
  return null
}

export { getSupabaseAdminClient as getAdmin }
