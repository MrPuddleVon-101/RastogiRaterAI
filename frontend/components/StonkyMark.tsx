'use client'

/**
 * The Stonky mark.
 *
 * The previous version stacked two overlapping ribbon parallelograms behind
 * three candlesticks with separate wicks: eight shapes inside a 64px box. At
 * the ~22px it actually renders at in the navbar, those shapes collapsed into
 * each other and the mark read as a smudge, which is why it looked deformed.
 *
 * This is built the other way round, from the silhouette in: one solid badge
 * and one bold rising line through it. Two shapes, heavy strokes, generous
 * spacing, so it survives being shrunk. The badge gives it presence against a
 * near-black navbar without needing a border.
 */

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
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        style={{ display: 'block', flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="stonky-badge" x1="4" y1="44" x2="44" y2="4" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#10B981" />
            <stop offset="1" stopColor="#4BF0AE" />
          </linearGradient>
        </defs>

        {/* One solid squircle: the whole silhouette, legible at any size. */}
        <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#stonky-badge)" />

        {/* A single rising line, knocked out in the dark page colour. Thick
            enough (4.5 at a 48 viewBox) that it never thins into the badge. */}
        <path
          d="M12 31 L20.5 22.5 L27 29 L37 17"
          stroke="#06130D"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Arrowhead, closing the gesture at the top right. */}
        <path
          d="M30.5 17 L37 17 L37 23.5"
          stroke="#06130D"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withWordmark && (
        <span
          style={{
            fontSize: '1.02rem',
            fontWeight: 600,
            color: 'var(--text)',
            letterSpacing: '-0.025em',
            lineHeight: 1,
          }}
        >
          Stonky
        </span>
      )}
    </span>
  )
}
