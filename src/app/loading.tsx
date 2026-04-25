import Logo from '@/components/layout/Logo'

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#050508]/80 backdrop-blur-sm flex flex-col items-center justify-center">
      <div className="relative flex flex-col items-center justify-center animate-pulse">
        <Logo size="lg" showText={false} className="mb-4" />
        <div className="flex gap-1.5 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
