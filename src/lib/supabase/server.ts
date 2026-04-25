/**
 * Supabase Server Client
 * Use this in Server Components, Route Handlers, and Server Actions.
 * Reads/writes cookies for session management.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export async function getSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — cookies are read-only.
            // This is safe to ignore if you have a middleware refreshing sessions.
          }
        },
      },
    }
  )
}

/**
 * Supabase Admin Client (Service Role)
 * Use ONLY in trusted server-side contexts (webhooks, admin API routes).
 * NEVER expose the service role key to the client.
 */
import { createClient } from '@supabase/supabase-js'

export function getSupabaseAdminClient(): SupabaseClient<Database> {

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
