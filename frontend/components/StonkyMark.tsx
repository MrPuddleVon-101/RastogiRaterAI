'use client'

// The Stonky mark: an S of two ribbon sweeps with three rising candlesticks,
// in muted emerald on graphite. Drawn inline as SVG so it is always crisp at
// any size and can never render as a broken image.

interface StonkyMarkProps {
  /** Icon height in px. */
  size?: number
  /** Show the wordmark text next to the icon. */
  withWordmark?: boolean
}

export function StonkyMark({ size = 26, withWordmark = true }: StonkyMarkProps) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="stonky-rib" x1="0" y1="64" x2="64" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#2E7B54" />
            <stop offset="1" stopColor="#5FBF8A" />
          </linearGradient>
        </defs>
        {/* ribbon sweeps */}
        <path d="M60 4 L60 16 L12 34 L12 22 Z" fill="url(#stonky-rib)" opacity="0.92" />
        <path d="M4 60 L4 48 L52 30 L52 42 Z" fill="url(#stonky-rib)" opacity="0.92" />
        {/* rising candlesticks */}
        <g stroke="#5FBF8A" strokeWidth="2" strokeLinecap="round">
          <line x1="22" y1="26" x2="22" y2="44" />
          <line x1="32" y1="22" x2="32" y2="40" />
          <line x1="42" y1="17" x2="42" y2="36" />
        </g>
        <g fill="#5FBF8A">
          <rect x="18.6" y="30.5" width="6.8" height="8.5" rx="1.2" />
          <rect x="28.6" y="26.5" width="6.8" height="8.5" rx="1.2" />
          <rect x="38.6" y="21.5" width="6.8" height="9.5" rx="1.2" />
        </g>
      </svg>
      {withWordmark && (
        <span
          className="font-semibold"
          style={{ fontSize: '1rem', color: 'var(--text)', letterSpacing: '-0.015em', lineHeight: 1 }}
        >
          Stonky
        </span>
      )}
    </span>
  )
}
