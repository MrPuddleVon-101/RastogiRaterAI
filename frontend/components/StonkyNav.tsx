'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from 'motion/react'
import { Home, Sparkles, Bookmark, LogIn, Menu, X } from 'lucide-react'
import { StonkyMark } from '@/components/StonkyMark'
import { scrollToTop, scrollToId } from '@/components/landing/LandingSmoothScroll'

interface StonkyNavProps {
  /** Open the shared watchlist drawer. */
  onOpenWatchlist: () => void
  /** Number of saved stocks, shown as a small badge. */
  watchlistCount: number
  /** Which nav item should read as active. Defaults to the current route. */
  active?: 'home' | 'discover'
  /** Override the Home action (e.g. the report view resets to a new search). */
  onHome?: () => void
}

// The one floating glass navbar, shared across every main page. A single glass
// object layered above the page: at the top of the page it floats wide and airy
// with the wordmark spelled out; as the user scrolls it condenses continuously
// (scroll-linked, not a binary snap) into a tighter, darker, deeper puck. All
// morphs are transform/opacity/color interpolations driven by springs, so the
// transition is buttery at any scroll speed and cheap to render. Routing is
// route-aware via usePathname; Watchlist is driven by the host page.
export function StonkyNav({ onOpenWatchlist, watchlistCount, active, onHome }: StonkyNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)

  const current: 'home' | 'discover' = active ?? (pathname?.startsWith('/discover') ? 'discover' : 'home')

  // Continuous condensation: 0 at page top -> 1 once the reader is in the page.
  const { scrollY } = useScroll()
  const raw = useTransform(scrollY, [0, 160], [0, 1])
  const p = useSpring(raw, { stiffness: 210, damping: 28, mass: 0.6 })

  // Morph channels (all cheap: transforms, colors, filters on one element).
  // At rest the bar is deliberately large and high-contrast so it reads as a
  // real piece of chrome rather than a faint ghost over the hero; by the time
  // the reader is into the page it has condensed to roughly two-thirds the
  // visual weight. Type scales with it via `fontSize` on the container, with
  // every child sized in `em`, so the whole bar shrinks as one object.
  const padY = useTransform(p, [0, 1], [15, 8])
  const padX = useTransform(p, [0, 1], [20, 12])
  const gap = useTransform(p, [0, 1], [14, 8])
  const fontSize = useTransform(p, [0, 1], [15.2, 13])
  const markScale = useTransform(p, [0, 1], [1, 0.82])
  const scale = useTransform(p, [0, 1], [1, 0.975])
  const top = useTransform(p, [0, 1], [22, 10])
  // Rest: a lifted, clearly-lit slab. Condensed: darker and denser.
  const bg = useTransform(p, [0, 1], ['rgba(22,26,32,0.82)', 'rgba(9,10,13,0.88)'])
  const borderC = useTransform(p, [0, 1], ['rgba(104,116,136,0.60)', 'rgba(72,82,98,0.55)'])
  const shadow = useTransform(
    p,
    [0, 1],
    [
      '0 18px 44px rgba(0,0,0,0.50), 0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)',
      '0 14px 40px rgba(0,0,0,0.58), 0 2px 10px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
    ],
  )
  const blur = useTransform(p, [0, 1], ['blur(20px) saturate(150%)', 'blur(26px) saturate(160%)'])
  // A soft emerald halo under the bar at rest, gone once condensed. This is
  // what makes it "pop" off the near-black hero without adding a hard border.
  const haloOpacity = useTransform(p, [0, 1], [1, 0])
  // The wordmark collapses away as the bar condenses (width+opacity, no layout jank:
  // it animates max-width on a tiny text node, contained inside the pill).
  const wordW = useTransform(p, [0, 0.6], [64, 0])
  const wordO = useTransform(p, [0, 0.45], [1, 0])
  const wordM = useTransform(p, [0, 0.6], [6, 0])

  // Reduced motion: no scroll morph, just a settled glass bar.
  useEffect(() => { if (reduced) p.jump(1) }, [reduced, p])

  const handleHome = () => {
    setOpen(false)
    if (onHome) { onHome(); return }
    if (pathname === '/') scrollToTop()
    else router.push('/')
  }

  const handleJoin = () => {
    setOpen(false)
    if (pathname === '/') scrollToId('join')
    else router.push('/#join')
  }

  // Center nav items, shared between the desktop pill and the mobile sheet.
  const items = (
    <>
      <button
        onClick={handleHome}
        className={`nav-pill ${current === 'home' ? 'nav-pill--active' : ''}`}
        aria-current={current === 'home' ? 'page' : undefined}
      >
        <Home size={14} strokeWidth={2.25} />
        <span>Home</span>
      </button>
      <Link
        href="/discover"
        className={`nav-pill ${current === 'discover' ? 'nav-pill--active' : ''}`}
        aria-current={current === 'discover' ? 'page' : undefined}
        onClick={() => setOpen(false)}
      >
        <Sparkles size={14} strokeWidth={2.25} />
        <span>Ask Ticky</span>
      </Link>
      <button onClick={() => { setOpen(false); onOpenWatchlist() }} className="nav-pill">
        <Bookmark size={14} strokeWidth={2.25} />
        <span>Watchlist</span>
        {watchlistCount > 0 && <span className="nav-badge">{watchlistCount}</span>}
      </button>
    </>
  )

  return (
    // The outer element owns centering; the motion element owns entrance + morph
    // transforms so they never clobber each other.
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className="fixed inset-x-3 sm:inset-x-0 z-[60] flex justify-center"
      style={{ top }}
    >
     <div className="w-full sm:w-auto">
      <motion.div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex items-center rounded-2xl sm:rounded-full overflow-hidden"
        style={{
          paddingTop: padY,
          paddingBottom: padY,
          paddingLeft: padX,
          paddingRight: padX,
          columnGap: gap,
          fontSize,
          scale,
          background: bg,
          border: '1px solid transparent',
          borderColor: borderC,
          backdropFilter: blur,
          WebkitBackdropFilter: blur,
          boxShadow: shadow,
        }}
      >
        {/* Emerald halo: present at rest, gone once the bar condenses. */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            opacity: haloOpacity,
            background:
              'radial-gradient(120% 180% at 50% 120%, rgba(46,148,102,0.20) 0%, transparent 62%)',
          }}
        />
        {/* top specular line: the "glass edge" catching light */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)' }}
        />
        {/* hover light sweep across the glass */}
        {!reduced && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-24"
            style={{ background: 'linear-gradient(105deg, transparent, rgba(255,255,255,0.07), transparent)' }}
            initial={false}
            animate={hovered ? { x: ['-120%', '560%'] } : { x: '-120%' }}
            transition={hovered ? { duration: 1.1, ease: 'easeInOut' } : { duration: 0 }}
          />
        )}

        {/* Brand: mark + collapsing wordmark */}
        <button onClick={handleHome} className="relative flex items-center pl-1 shrink-0" aria-label="Stonky home">
          <motion.span
            className="grid place-items-center shrink-0"
            style={{ scale: markScale, transformOrigin: 'center' }}
          >
            <StonkyMark size={28} withWordmark={false} />
          </motion.span>
          <motion.span
            className="hidden sm:block overflow-hidden whitespace-nowrap font-semibold"
            style={{ maxWidth: wordW, opacity: wordO, marginLeft: wordM, color: 'var(--text)', letterSpacing: '-0.03em', fontSize: '1.02em' }}
          >
            Stonky
          </motion.span>
        </button>

        {/* Divider */}
        <span className="hidden sm:block h-5 w-px shrink-0" style={{ background: 'var(--border-3)' }} />

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1 relative">{items}</nav>

        {/* Divider */}
        <span className="hidden sm:block h-5 w-px shrink-0" style={{ background: 'var(--border-3)' }} />

        {/* Sign up / login (desktop) */}
        <button
          onClick={handleJoin}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full shrink-0 transition-all"
          style={{
            padding: '0.6em 1.15em',
            fontSize: '0.84em',
            fontWeight: 600,
            background: 'linear-gradient(180deg, #4FC98D 0%, #2E9466 100%)',
            color: '#06140D',
            boxShadow: '0 8px 22px rgba(46,148,102,0.42), inset 0 1px 0 rgba(255,255,255,0.28)',
          }}
          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
          onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
        >
          <LogIn size={14} strokeWidth={2.5} />
          Sign Up / Login
        </button>

        {/* Mobile toggle */}
        <div className="flex sm:hidden items-center gap-2 ml-auto">
          <button
            onClick={handleJoin}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ background: 'linear-gradient(180deg, #3FB07C 0%, #2E9466 100%)', color: '#06140D' }}
          >
            <LogIn size={13} strokeWidth={2.5} />
            Join
          </button>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center justify-center w-8 h-8 rounded-full"
            style={{ color: 'var(--text-2)', background: 'var(--surface-2)' }}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </motion.div>

      {/* Mobile sheet */}
      <div
        className="sm:hidden overflow-hidden transition-all duration-300 mt-2 rounded-2xl"
        style={{
          maxHeight: open ? 240 : 0,
          opacity: open ? 1 : 0,
          background: 'rgba(12,13,16,0.92)',
          border: open ? '1px solid var(--border-2)' : '1px solid transparent',
          backdropFilter: 'blur(18px)',
        }}
      >
        <nav className="flex flex-col gap-1 p-2">{items}</nav>
      </div>

      <style jsx>{`
        /* Sized in em units so the whole bar scales from the container
           font-size, which the scroll progress drives, as a single object. */
        :global(.nav-pill) {
          display: inline-flex;
          align-items: center;
          gap: 0.5em;
          padding: 0.56em 0.95em;
          border-radius: 9999px;
          font-size: 0.88em;
          font-weight: 500;
          letter-spacing: -0.01em;
          color: #C9C5BD;
          white-space: nowrap;
          transition: color 0.2s ease, background 0.2s ease;
        }
        :global(.nav-pill:hover) {
          color: var(--text);
          background: rgba(255, 255, 255, 0.08);
        }
        :global(.nav-pill--active) {
          color: #0a0b0e;
          background: #f4f1ea;
          font-weight: 600;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.6);
        }
        :global(.nav-pill--active:hover) {
          color: #0a0b0e;
          background: #ffffff;
        }
        :global(.nav-badge) {
          min-width: 1.25em;
          height: 1.25em;
          padding: 0 0.35em;
          border-radius: 9999px;
          font-size: 0.7em;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-bg);
          color: var(--accent-2);
          font-family: var(--font-mono);
        }
      `}</style>
     </div>
    </motion.header>
  )
}
