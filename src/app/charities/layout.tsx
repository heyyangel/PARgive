import Navbar from '@/components/layout/Navbar'

export default function CharitiesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* @ts-expect-error Async Server Component */}
      <Navbar />
      {children}
    </div>
  )
}
