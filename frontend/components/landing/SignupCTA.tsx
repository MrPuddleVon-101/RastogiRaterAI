'use client'
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { scrollToTop } from './LandingSmoothScroll'

// Premium CTA / sign-up section. Dark dotted grid, glassy card, Stonky green
// accents, inspired by the sign-in component but with Stonky copy. There is no
// real auth yet, so the actions route into the live product (the hero search
// and Ask Ticky); kept as a polished, honest front-end CTA.
export function SignupCTA() {
  const [email, setEmail] = useState('')
  const reduced = useReducedMotion()

  const toSearch = () => scrollToTop()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    toSearch()
  }

  return (
    <section id="join" className="relative px-6 pt-20 sm:pt-28 pb-12 sm:pb-16 overflow-hidden">
      {/* Dotted grid backdrop */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1.4px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(70% 60% at 50% 45%, #000 0%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(70% 60% at 50% 45%, #000 0%, transparent 80%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'radial-gradient(60% 50% at 50% 40%, rgba(46,148,102,0.16) 0%, rgba(7,7,9,0) 70%)' }}
      />

      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 30 }}
        whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-90px' }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-md mx-auto text-center"
      >
        <p className="eyebrow mb-4" style={{ color: 'var(--pos)' }}>Get started</p>
        <h2 className="font-bold" style={{ fontSize: 'clamp(2.1rem, 5.2vw, 3.1rem)', lineHeight: 1.04, letterSpacing: '-0.035em', color: 'var(--text)' }}>
          Enter the research floor.
        </h2>
        <p className="mt-4" style={{ color: 'var(--text-2)', fontSize: '1.05rem', lineHeight: 1.55 }}>
          Build your first stock thesis. Search any ticker, run the score, and read the receipts behind it.
        </p>

        <div className="mt-8 space-y-4">
          <button
            onClick={toSearch}
            className="w-full flex items-center justify-center gap-2.5 rounded-full py-3.5 px-4 text-sm font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid var(--border-3)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          >
            <GoogleGlyph />
            Sign in with Google
          </button>

          <div className="flex items-center gap-4">
            <span className="h-px flex-1" style={{ background: 'var(--border-2)' }} />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>or</span>
            <span className="h-px flex-1" style={{ background: 'var(--border-2)' }} />
          </div>

          <form onSubmit={submit} className="relative">
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-full py-3.5 pl-5 pr-14 text-center text-sm outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text)', border: '1px solid var(--border-3)' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#2E9466')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-3)')}
            />
            <button
              type="submit"
              aria-label="Start researching"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full transition-transform"
              style={{ background: 'linear-gradient(180deg, #3FB07C 0%, #2E9466 100%)', color: '#06140D' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-50%) scale(1.06)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(-50%) scale(1)')}
            >
              <ArrowRight size={17} strokeWidth={2.5} />
            </button>
          </form>
        </div>

        <p className="mt-6 text-xs" style={{ color: 'var(--muted)' }}>
          Prefer ideas first?{' '}
          <Link href="/discover" className="underline transition-colors" style={{ color: 'var(--text-2)' }}>
            Ask Ticky
          </Link>
          {' '}for a deck to deep dive.
        </p>
      </motion.div>
    </section>
  )
}

function GoogleGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  )
}
