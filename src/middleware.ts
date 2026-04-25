/**
 * Next.js Middleware — Auth + Subscription Guard
 * Runs on every matched route.
 * 1. Refreshes the Supabase session cookie.
 * 2. Redirects unauthenticated users to /login.
 * 3. Redirects subscribers-only routes to /subscribe if inactive.
 * 4. Guards /admin for admin-role users only.
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/types'

/** Routes that require the user to be logged in */
const PROTECTED_ROUTES = ['/dashboard', '/draws', '/scores', '/account', '/charities', '/admin']
/** Protected routes that also require an active subscription */
const SUBSCRIPTION_ROUTES = ['/dashboard', '/draws', '/scores', '/charities']
/** Routes only accessible to admins */
const ADMIN_ROUTES = ['/admin']
/** Auth pages — redirect to /dashboard if already logged in */
const AUTH_PAGES = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // MUST call getUser() to refresh the session token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── 1. Redirect authenticated users away from auth pages ──────
  if (user && AUTH_PAGES.some((p) => pathname === p)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const isProtected       = PROTECTED_ROUTES.some((p) => pathname.startsWith(p))
  const isAdminRoute      = ADMIN_ROUTES.some((p) => pathname.startsWith(p))
  const isSubscriptionReq = SUBSCRIPTION_ROUTES.some((p) => pathname.startsWith(p))

  // ── 2. Not authenticated → /login ────────────────────────────
  if (isProtected && !user) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // ── 3. Authenticated: check subscription for gated routes ────
  if (user && isSubscriptionReq) {
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', user.id)
      .single()

    const isActive =
      profile?.subscription_status === 'active' ||
      profile?.subscription_status === 'trialing'

    if (!isActive) {
      return NextResponse.redirect(new URL('/subscribe', request.url))
    }
  }

  // ── 4. Admin route: must have admin role in user_metadata ─────
  if (isAdminRoute && user?.user_metadata?.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
