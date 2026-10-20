'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Home, Sparkles, Bookmark, LogIn, Menu, X } from 'lucide-react'
import { StonkyMark } from '@/components/StonkyMark'
import { scrollToTop, scrollToId } from './LandingSmoothScroll'

interface LandingNavProps {
  /** Open the shared watchlist drawer. */
  onOpenWatchlist: () => void
  /** Number of saved stocks, shown as a small badge. */
  watchlistCount: number
}

// Floating glass pill navbar for the Stonky landing page. Sits near the top
// center, frosted and rounded, with a white active pill on Home. Routes to the
// existing pages where they exist (Ask Ticky -> /discover) and drives in-page
// actions for Watchlist (shared drawer) and Sign up (CTA section) otherwise.
export function LandingNav({ onOpenWatchlist, watchlistCount }: LandingNavProps) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toTop = () => {
    setOpen(false)
    scrollToTop()
  }

  const toSection = (id: string) => {
    setOpen(false)
    scrollToId(id)
  }

  // Center nav items shared between desktop pill and mobile sheet.
  const items = (
    <>
      <button onClick={toTop} className="nav-pill nav-pill--active" aria-current="page">
        <Home size={14} strokeWidth={2.25} />
        <span>Home</span>
      </button>
      <Link href="/discover" className="nav-pill" onClick={() => setOpen(false)}>
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
    // Outer element owns the horizontal centering. The inner motion element
    // owns the entrance transform, so the two never clobber each other (Framer
    // writes an inline `transform` that would otherwise wipe out -translate-x).
    <motion.header
      initial={{ y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="fixed top-4 inset-x-3 sm:inset-x-0 z-[60] flex justify-center"
    >
     <div className="w-full sm:w-auto">
      <div
        className="flex items-center gap-2 sm:gap-3 rounded-2xl sm:rounded-full px-3 sm:px-3 py-2.5 transition-all duration-500"
        style={{
          background: scrolled ? 'rgba(12,13,16,0.72)' : 'rgba(18,20,25,0.5)',
          border: '1px solid var(--border-2)',
          backdropFilter: 'blur(18px) saturate(140%)',
          WebkitBackdropFilter: 'blur(18px) saturate(140%)',
          boxShadow: scrolled
            ? '0 14px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
            : '0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* Brand */}
        <button onClick={toTop} className="flex items-center pl-1 pr-1 sm:pr-2 shrink-0" aria-label="Stonky home">
          <StonkyMark size={22} />
        </button>

        {/* Divider */}
        <span className="hidden sm:block h-5 w-px shrink-0" style={{ background: 'var(--border-3)' }} />

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">{items}</nav>

        {/* Divider */}
        <span className="hidden sm:block h-5 w-px shrink-0" style={{ background: 'var(--border-3)' }} />

        {/* Sign up / login (desktop) */}
        <button
          onClick={() => toSection('join')}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold shrink-0 transition-all"
          style={{ background: 'linear-gradient(180deg, #3FB07C 0%, #2E9466 100%)', color: '#06140D', boxShadow: '0 6px 18px rgba(46,148,102,0.35)' }}
          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
          onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
        >
          <LogIn size={14} strokeWidth={2.5} />
          Sign Up / Login
        </button>

        {/* Mobile toggle */}
        <div className="flex sm:hidden items-center gap-2 ml-auto">
          <button
            onClick={() => toSection('join')}
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
      </div>

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
        :global(.nav-pill) {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.5rem 0.85rem;
          border-radius: 9999px;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: -0.01em;
          color: var(--text-2);
          white-space: nowrap;
          transition: color 0.2s ease, background 0.2s ease;
        }
        :global(.nav-pill:hover) {
          color: var(--text);
          background: rgba(255, 255, 255, 0.04);
        }
        :global(.nav-pill--active) {
          color: #0a0b0e;
          background: #f4f1ea;
          font-weight: 600;
        }
        :global(.nav-pill--active:hover) {
          color: #0a0b0e;
          background: #ffffff;
        }
        :global(.nav-badge) {
          min-width: 1.05rem;
          height: 1.05rem;
          padding: 0 0.3rem;
          border-radius: 9999px;
          font-size: 0.62rem;
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
