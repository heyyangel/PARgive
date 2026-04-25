import Navbar from '@/components/layout/Navbar'

/**
 * Layout for all authenticated pages (dashboard, scores, charities, account, admin).
 * Shows the global navbar. The homepage and auth pages (login/signup/subscribe)
 * use the root layout directly without this navbar.
 */
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* @ts-expect-error Async Server Component */}
      <Navbar />
      {children}
    </div>
  )
}
