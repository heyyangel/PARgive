import Link     from 'next/link'
import { requireAdminUser } from '@/lib/admin-guard'
import Navbar from '@/components/layout/Navbar'
import SignOutButton from '@/components/layout/SignOutButton'

const NAV = [
  { href: '/admin',            label: 'Analytics',  icon: '📊' },
  { href: '/admin/users',      label: 'Users',      icon: '👥' },
  { href: '/admin/draws',      label: 'Draws',      icon: '🎲' },
  { href: '/admin/charities',  label: 'Charities',  icon: '❤️' },
  { href: '/admin/winners',    label: 'Winners',    icon: '🏆' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminUser()   // Redirect non-admins before rendering anything

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <Navbar />

      <div className="flex">
        {/* ── Sidebar ── */}
        <aside className="w-56 flex-shrink-0 border-r border-white/8 flex flex-col sticky top-14 h-[calc(100vh-3.5rem)] hidden md:flex">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <span className="text-white font-semibold text-sm">Admin Panel</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/8 transition-all duration-200 group"
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-white/8 space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              User dashboard
            </Link>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 overflow-auto">
          {/* Mobile admin nav */}
          <div className="md:hidden border-b border-white/8 px-4 py-2 flex gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white/45 hover:text-white hover:bg-white/8 transition-all whitespace-nowrap">
                <span>{item.icon}</span> {item.label}
              </Link>
            ))}
          </div>
          <div className="max-w-6xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

