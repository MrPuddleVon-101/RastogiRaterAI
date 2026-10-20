'use client'
import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'

/**
 * What Stonky actually does, in four concrete steps.
 *
 * This replaces two pinned scenes that between them held the reader for about
 * seven screens of floating chips and stage labels without ever saying a plain
 * sentence about the product. Every claim here is specific and checkable: the
 * counts below are what the engine really returns.
 *
 * The rail on the left fills as the section scrolls, so the sequence reads as
 * a pipeline being traced rather than four cards in a row. One scroll-linked
 * scaleY drives it; there is no per-frame JavaScript.
 */

const STEPS = [
  {
    n: '01',
    title: 'It pulls the raw filings',
    body:
      'Price history, income statement, balance sheet, cash flow, analyst targets and earnings surprises, straight from the source rather than a summary of a summary.',
    stat: '252 trading days',
    statNote: 'of price and moving averages per ticker',
  },
  {
    n: '02',
    title: 'It scores six things that decide ownership',
    body:
      'Valuation, profitability, cash flow and debt, technicals, analyst context and data confidence. Each is scored out of its own ceiling, so one strong quarter cannot paper over a weak balance sheet.',
    stat: '6 categories',
    statNote: 'weighted into one 0-100 number',
  },
  {
    n: '03',
    title: 'It keeps the receipts',
    body:
      'Every point is traced back to the metric that earned it, with the actual figure, the signal it sends, and a plain-English note on why it matters.',
    stat: '23 metrics',
    statNote: 'shown with the reasoning attached',
  },
  {
    n: '04',
    title: 'It gives you a cold take',
    body:
      'A one-line verdict, a long-term thesis bias, the best argument for owning it and the biggest risk against. Written to be blunt, not to sell you the trade.',
    stat: '~5 seconds',
    statNote: 'from ticker to finished thesis',
  },
]

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 72%', 'end 55%'] })
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.5 })
  const railScale = useTransform(fill, v => (reduced ? 1 : v))

  return (
    <section className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
      <div className="max-w-2xl">
        <h2 className="t-section" style={{ color: 'var(--text)' }}>
          What it actually <span style={{ color: '#5FBF8A' }}>does</span>.
        </h2>
        <p className="t-lead mt-4">
          No black box and no vibes. Four steps, every one of them showing its working.
        </p>
      </div>

      <div ref={ref} className="relative mt-14">
        {/* the rail */}
        <div
          aria-hidden
          className="absolute left-[15px] sm:left-[19px] top-2 bottom-2 w-px hidden sm:block"
          style={{ background: 'rgba(255,255,255,0.09)' }}
        />
        <motion.div
          aria-hidden
          className="absolute left-[15px] sm:left-[19px] top-2 bottom-2 w-px origin-top hidden sm:block"
          style={{
            scaleY: railScale,
            background: 'linear-gradient(180deg, #5FD3A0, #2E9466)',
            boxShadow: '0 0 14px rgba(46,148,102,0.55)',
          }}
        />

        <ol className="grid gap-px">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.n}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-12%' }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="group relative grid gap-x-6 gap-y-3 py-8 sm:pl-[68px]"
              style={{ gridTemplateColumns: 'minmax(0,1fr)' }}
            >
              {/* node + step number, set in the display face */}
              <span
                aria-hidden
                className="absolute left-0 top-[34px] hidden sm:grid place-items-center rounded-full transition-colors duration-500"
                style={{
                  width: 39,
                  height: 39,
                  background: 'var(--bg)',
                  border: '1px solid rgba(255,255,255,0.14)',
                }}
              >
                <span
                  className="t-num transition-colors duration-500"
                  style={{ fontSize: '0.74rem', color: 'var(--muted)' }}
                >
                  {s.n}
                </span>
              </span>

              <div className="grid gap-x-10 gap-y-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] items-start">
                <div>
                  <h3
                    className="t-sub"
                    style={{ color: 'var(--text)', fontFamily: 'var(--font-display), Georgia, serif', letterSpacing: '-0.01em' }}
                  >
                    {s.title}
                  </h3>
                  <p className="t-body mt-2.5">{s.body}</p>
                </div>

                {/* the concrete number, so each step is checkable */}
                <div
                  className="relative overflow-hidden rounded-xl px-5 py-4 transition-all duration-500 group-hover:translate-y-[-2px]"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <p className="t-num" style={{ fontSize: '1.28rem', color: '#5FBF8A', letterSpacing: '-0.02em' }}>
                    {s.stat}
                  </p>
                  <p className="t-label mt-1" style={{ letterSpacing: '0.01em', textTransform: 'none' }}>
                    {s.statNote}
                  </p>
                </div>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
