/**
 * PARgive Logo — golf flag with heart accent.
 * Use size prop: 'sm' (20px), 'md' (32px), 'lg' (36px)
 */
export default function Logo({
  size = 'md',
  showText = true,
  className = '',
}: {
  size?:     'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}) {
  const dims = { sm: 20, md: 32, lg: 36 }
  const textSize = { sm: 'text-xs', md: 'text-base', lg: 'text-lg' }
  const iconPx = dims[size]

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-violet-600 flex items-center justify-center shadow-lg shadow-emerald-900/30 flex-shrink-0"
        style={{ width: iconPx, height: iconPx }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: iconPx * 0.6, height: iconPx * 0.6 }}
        >
          {/* Flag pole */}
          <path
            d="M7 3v18"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Flag */}
          <path
            d="M7 3h9l-3 4 3 4H7"
            fill="rgba(255,255,255,0.9)"
            stroke="white"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {/* Heart (charity symbol) */}
          <path
            d="M15.5 14.5c0 0-1 .7-2.5 2-1.5-1.3-2.5-2-2.5-2a1.8 1.8 0 0 1-.2-2.5 1.6 1.6 0 0 1 2.3-.2l.4.4.4-.4a1.6 1.6 0 0 1 2.3.2 1.8 1.8 0 0 1-.2 2.5z"
            fill="#f472b6"
            stroke="none"
          />
          {/* Ground dot */}
          <circle cx="7" cy="21" r="1.5" fill="white" opacity="0.6" />
        </svg>
      </span>
      {showText && (
        <span className={`font-bold tracking-tight text-white ${textSize[size]}`}>
          PARgive
        </span>
      )}
    </span>
  )
}
