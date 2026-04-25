/**
 * GET /auth/callback
 * Handles Supabase email confirmation and OAuth redirects.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient }   from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code       = searchParams.get('code')
  const next       = searchParams.get('next') ?? '/dashboard'
  const error      = searchParams.get('error')
  const errorDesc  = searchParams.get('error_description')

  if (error) {
    console.error('[auth/callback]', error, errorDesc)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDesc ?? error)}`
    )
  }

  if (code) {
    const supabase = await getSupabaseServerClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv    = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Something+went+wrong`)
}
