import Link from 'next/link'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import SignOutButton from '@/components/layout/SignOutButton'
import Logo from '@/components/layout/Logo'

const NAV_LINKS = [
  { href: '/dashboard',  label: 'Dashboard',  icon: '📊' },
  { href: '/scores',     label: 'Scores',     icon: '⛳' },
  { href: '/charities',  label: 'Charities',  icon: '❤️' },
]

export default async function Navbar() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null   // Don't show navbar on public/auth pages

  // Fetch name + role for display
  const { data: profile } = await supabase
    .from('users')
    .select('name, subscription_status')
    .eq('id', user.id)
    .single()

  const isAdmin = user.user_metadata?.role === 'admin'
  const displayName = (profile?.name ?? user.email ?? '').split(' ')[0]
  const initials = (profile?.name ?? user.email ?? '?')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="sticky top-0 z-50 bg-[#050508]/80 backdrop-blur-xl border-b border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <Logo size="md" />
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/45 hover:text-white hover:bg-white/8 transition-all duration-200"
                >
                  <span className="text-sm">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-violet-400/60 hover:text-violet-300 hover:bg-violet-500/10 transition-all duration-200"
                >
                  <span className="text-sm">⚙️</span>
                  <span>Admin</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Right: User menu */}
          <div className="flex items-center gap-3">
            {/* Settings */}
            <Link
              href="/account/settings"
              className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all"
              title="Settings"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>

            {/* User avatar + sign out */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600/50 to-indigo-600/50 border border-white/10 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">{initials}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-white text-xs font-medium leading-tight">{displayName}</p>
                <p className="text-white/25 text-[10px] leading-tight">{user.email}</p>
              </div>
            </div>

            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-white/5 px-4 py-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white/45 hover:text-white hover:bg-white/8 transition-all whitespace-nowrap"
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-violet-400/60 hover:text-violet-300 hover:bg-violet-500/10 transition-all whitespace-nowrap">
              <span>⚙️</span> Admin
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
