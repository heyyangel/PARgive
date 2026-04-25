/**
 * Supabase Browser Client
 * Use this in Client Components ("use client") only.
 * It creates a single instance per browser session.
 */
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'

let client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseBrowserClient() {
  if (client) return client

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return client
}
