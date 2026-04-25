import type { Metadata } from 'next'
import Logo from '@/components/layout/Logo'

export const metadata: Metadata = {
  title: 'Sign in — PARgive',
  description: 'Sign in to your PARgive account',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050508] flex">
      {/* ── Left Branding Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(109,40,217,0.35) 0%, transparent 70%), ' +
              'radial-gradient(ellipse 60% 50% at 80% 100%, rgba(79,70,229,0.25) 0%, transparent 65%), ' +
              '#050508',
          }}
        />
        {/* Glowing orbs */}
        <div className="absolute top-32 left-24 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-24 right-12 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl" />

        <div className="relative z-10">
          <Logo size="lg" />
        </div>

        {/* Center quote */}
        <div className="relative z-10">
          <blockquote className="text-3xl font-semibold text-white leading-snug">
            "Play. Win.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              Give back.
            </span>"
          </blockquote>
          <p className="mt-4 text-white/50 text-sm leading-relaxed max-w-xs">
            Every subscription enters you into monthly prize draws while supporting
            the charity closest to your heart.
          </p>
        </div>

        {/* Stats strip */}
        <div className="relative z-10 flex gap-8">
          {[
            { label: 'Active Members',   value: '12,400+' },
            { label: 'Drawn This Year',  value: '$240,000' },
            { label: 'Charities Backed', value: '38' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-white text-xl font-bold">{s.value}</p>
              <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
