'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Sparkles } from 'lucide-react'

// "Ask Ticky Anything" — the bridge from the story into the assistant. Modeled
// on the reference sign-in composition: a calm centered stack over a living
// dotted field. The input is an invitation, not a form: clicking anything in
// it routes into /discover where the real Ticky chat lives.

const PROMPTS = [
  'Find me stable long-term compounders',
  'Show me AI stocks with real momentum',
  'I want lower-risk dividend ideas',
]

// The placeholder types itself, waits, erases, moves on: the box feels alive
// before the user ever touches it.
function useTypedPrompt(active: boolean) {
  const [text, setText] = useState(PROMPTS[0])
  useEffect(() => {
    if (!active) { setText(PROMPTS[0]); return }
    let i = 0, ci = 0, deleting = false, alive = true
    let t: ReturnType<typeof setTimeout>
    const run = () => {
      if (!alive) return
      const full = PROMPTS[i]
      if (!deleting) {
        ci++
        setText(full.slice(0, ci))
        if (ci >= full.length) { deleting = true; t = setTimeout(run, 2100); return }
        t = setTimeout(run, 44)
      } else {
        ci--
        setText(full.slice(0, ci))
        if (ci <= 0) { deleting = false; i = (i + 1) % PROMPTS.length; t = setTimeout(run, 380); return }
        t = setTimeout(run, 20)
      }
    }
    t = setTimeout(run, 700)
    return () => { alive = false; clearTimeout(t) }
  }, [active])
  return text
}

export function AskTickyCTA() {
  const router = useRouter()
  const reduced = useReducedMotion()
  const typed = useTypedPrompt(!reduced)
  const go = () => router.push('/discover')

  return (
    <section className="relative px-6 py-24 sm:py-32 overflow-hidden">
      {/* living dotted field */}
      <div
        aria-hidden
        className="absolute inset-0 att-dots"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.13) 1px, transparent 1.4px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(75% 70% at 50% 46%, #000 0%, transparent 82%)',
          WebkitMaskImage: 'radial-gradient(75% 70% at 50% 46%, #000 0%, transparent 82%)',
        }}
      />
      {/* breathing emerald heart */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'radial-gradient(46% 42% at 50% 44%, rgba(46,148,102,0.17) 0%, rgba(7,7,9,0) 70%)' }}
        animate={reduced ? undefined : { opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-90px' }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-xl mx-auto text-center"
      >
        {/* Ticky, small and clean above the wordline */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascots/ticky.png"
          alt="Ticky, the Stonky research guide"
          className="mx-auto mb-5"
          style={{ width: 74, height: 'auto', filter: 'drop-shadow(0 14px 26px rgba(0,0,0,0.55)) drop-shadow(0 0 22px rgba(46,148,102,0.3))' }}
        />

        <h2 className="font-bold" style={{ fontSize: 'clamp(2.2rem, 5.6vw, 3.4rem)', lineHeight: 1.03, letterSpacing: '-0.035em', color: 'var(--text)', textWrap: 'balance' }}>
          Ask Ticky <span style={{ color: '#3FB07C' }}>Anything</span>
        </h2>
        <p className="mt-4 mx-auto" style={{ color: 'var(--text-2)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '42ch' }}>
          No ticker in mind? Describe the goal in plain English and Ticky deals you a deck worth researching.
        </p>

        {/* the invitation: looks like the chat, routes to the chat */}
        <button
          onClick={go}
          data-cursor="hot"
          aria-label="Open Ask Ticky"
          className="group relative mt-8 w-full flex items-center gap-3 rounded-full py-2 pl-6 pr-2 text-left transition-all"
          style={{
            background: 'rgba(13,15,18,0.85)',
            border: '1px solid rgba(63,176,124,0.3)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 34px rgba(46,148,102,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(63,176,124,0.55)'; e.currentTarget.style.boxShadow = '0 24px 60px rgba(0,0,0,0.5), 0 0 48px rgba(46,148,102,0.22), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(63,176,124,0.3)'; e.currentTarget.style.boxShadow = '0 24px 60px rgba(0,0,0,0.5), 0 0 34px rgba(46,148,102,0.12), inset 0 1px 0 rgba(255,255,255,0.05)' }}
        >
          <Sparkles size={15} className="shrink-0" style={{ color: '#5FBF8A' }} />
          <span className="flex-1 truncate text-[0.95rem] py-2" style={{ color: 'var(--text-2)' }}>
            {typed}
            {!reduced && <span aria-hidden style={{ color: '#5FBF8A' }}>▍</span>}
          </span>
          <span
            className="flex items-center justify-center w-11 h-11 rounded-full shrink-0 transition-transform group-hover:scale-105"
            style={{ background: 'linear-gradient(180deg, #3FB07C 0%, #2E9466 100%)', color: '#06140D' }}
          >
            <ArrowRight size={18} strokeWidth={2.5} />
          </span>
        </button>

        <p className="mt-5 text-xs" style={{ color: 'var(--text-2)' }}>
          Free to try. Every pick opens a full Stonky deep dive.
        </p>
      </motion.div>

      <style jsx>{`
        .att-dots {
          animation: att-drift 26s linear infinite;
        }
        @keyframes att-drift {
          from { background-position: 0 0; }
          to { background-position: 96px 48px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .att-dots { animation: none; }
        }
      `}</style>
    </section>
  )
}
