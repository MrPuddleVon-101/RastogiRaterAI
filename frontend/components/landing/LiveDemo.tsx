'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useInView,
} from 'motion/react'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { RatingResponse, CategoryScore } from '@/lib/types'
import { fetchReportCached } from '@/lib/reportCache'

/**
 * The one section that shows the product instead of describing it.
 *
 * Everything below the hero used to be abstract: pinned scenes of floating
 * chips and numbered stages that never showed a single real thing Stonky
 * produces. This runs the actual engine against a real ticker, live, and lets
 * the reader drive it. It is the answer to "what does this thing even do".
 */

const TICKERS = [
  { t: 'NVDA', n: 'NVIDIA' },
  { t: 'AAPL', n: 'Apple' },
  { t: 'MSFT', n: 'Microsoft' },
  { t: 'COST', n: 'Costco' },
  { t: 'JPM', n: 'JPMorgan' },
  { t: 'TSLA', n: 'Tesla' },
]

const TONE: Record<string, string> = {
  positive: '#3FB07C',
  caution: '#C9A24C',
  negative: '#C25A5A',
  neutral: '#7E8794',
}

function arrowFor(color: string) {
  if (color === 'positive') return ArrowUpRight
  if (color === 'negative' || color === 'caution') return ArrowDownRight
  return Minus
}

/* ------------------------------------------------------------------ dial */

function ScoreDial({ score, active }: { score: number; active: boolean }) {
  const reduced = useReducedMotion()
  const R = 62
  const C = 2 * Math.PI * R
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { stiffness: 58, damping: 20, mass: 0.9 })
  const dash = useTransform(spring, v => C - (C * v) / 100)
  // Rendering the MotionValue directly keeps the count-up off the React
  // render path entirely. Subscribing with .on('change') into useState looked
  // equivalent but left the figure stuck on 0 while the arc animated.
  const shown = useTransform(spring, v => Math.round(v))

  useEffect(() => {
    if (!active) return
    if (reduced) { mv.jump(score); return }
    mv.set(score)
  }, [score, active, reduced, mv])

  return (
    <div className="relative shrink-0" style={{ width: 148, height: 148 }}>
      <svg width="148" height="148" viewBox="0 0 148 148" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="74" cy="74" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
        <motion.circle
          cx="74" cy="74" r={R} fill="none"
          stroke="url(#dialGrad)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={C}
          style={{ strokeDashoffset: dash }}
        />
        <defs>
          <linearGradient id="dialGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2E9466" />
            <stop offset="100%" stopColor="#5FD3A0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <motion.span
          className="t-num"
          style={{ fontSize: '2.9rem', fontWeight: 500, color: 'var(--text)', lineHeight: 1 }}
        >
          {shown}
        </motion.span>
        <span
          className="t-label absolute"
          style={{ bottom: 34, fontSize: '0.58rem', letterSpacing: '0.16em' }}
        >
          / 100
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- row */

function CategoryRow({ c, i, active }: { c: CategoryScore; i: number; active: boolean }) {
  const reduced = useReducedMotion()
  const pct = Math.round((c.score / c.maxScore) * 100)
  const tone = TONE[c.color] ?? TONE.neutral
  const Arrow = arrowFor(c.color)

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={active ? { opacity: 1, y: 0 } : { opacity: 0 }}
      transition={{ duration: 0.5, delay: 0.12 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="grid items-center gap-x-3 gap-y-1"
      style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}
    >
      <div className="flex items-baseline gap-2 min-w-0">
        <span style={{ fontSize: '0.88rem', color: 'var(--text)', fontWeight: 500 }}>{c.name}</span>
        <span className="t-label truncate" style={{ fontSize: '0.68rem' }}>{c.reason}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Arrow size={13} style={{ color: tone }} strokeWidth={2.4} />
        <span className="t-num" style={{ fontSize: '0.82rem', color: tone, minWidth: 44, textAlign: 'right' }}>
          {c.score}/{c.maxScore}
        </span>
      </div>
      <span
        className="col-span-2 block h-[5px] rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <motion.span
          className="block h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${tone}88, ${tone})` }}
          initial={{ width: 0 }}
          animate={{ width: active ? `${pct}%` : 0 }}
          transition={{ duration: reduced ? 0 : 1, delay: reduced ? 0 : 0.2 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
        />
      </span>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ main */

export function LiveDemo() {
  const reduced = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inView = useInView(wrapRef, { once: false, margin: '-15% 0px -15% 0px' })

  const [ticker, setTicker] = useState('NVDA')
  const [data, setData] = useState<RatingResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  // Only reach for the network once the section is actually near the viewport,
  // so the landing page's first paint never waits on the analysis engine.
  const [armed, setArmed] = useState(false)
  useEffect(() => { if (inView) setArmed(true) }, [inView])

  const load = useCallback(async (t: string) => {
    setLoading(true)
    setFailed(false)
    try {
      const d = await fetchReportCached(t)
      // Guard against an out-of-order response overwriting a newer selection.
      setData(prev => (latest.current === t ? d : prev))
    } catch {
      if (latest.current === t) setFailed(true)
    } finally {
      if (latest.current === t) setLoading(false)
    }
  }, [])

  // Which ticker the reader most recently asked for.
  const latest = useRef(ticker)
  useEffect(() => { latest.current = ticker }, [ticker])

  useEffect(() => { if (armed) load(ticker) }, [armed, ticker, load])

  // A cold analysis takes the engine several seconds. Once the first one is
  // on screen, quietly warm the rest so switching tickers is instant instead
  // of dropping the reader onto an empty panel every time.
  useEffect(() => {
    if (!data) return
    let cancelled = false
    const rest = TICKERS.map(x => x.t).filter(t => t !== data.ticker)
    ;(async () => {
      for (const t of rest) {
        if (cancelled) return
        try { await fetchReportCached(t) } catch { /* prefetch is best-effort */ }
      }
    })()
    return () => { cancelled = true }
    // keyed on the first successful load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(data)])

  // Cursor-reactive tilt. This is the page's real depth: a physical object
  // catching light, not a decorative canvas behind a flat card.
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 120, damping: 22, mass: 0.5 })
  const sy = useSpring(py, { stiffness: 120, damping: 22, mass: 0.5 })
  const rotateY = useTransform(sx, [-0.5, 0.5], [3.4, -3.4])
  const rotateX = useTransform(sy, [-0.5, 0.5], [-2.6, 2.6])
  const glareX = useTransform(sx, [-0.5, 0.5], ['12%', '88%'])
  const glareY = useTransform(sy, [-0.5, 0.5], ['6%', '94%'])
  const glare = useTransform(
    [glareX, glareY],
    ([x, y]) => `radial-gradient(520px circle at ${x} ${y}, rgba(120,200,165,0.09), transparent 62%)`,
  )

  const onMove = (e: React.PointerEvent) => {
    if (reduced || e.pointerType === 'touch' || !panelRef.current) return
    const r = panelRef.current.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width - 0.5)
    py.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onLeave = () => { px.set(0); py.set(0) }

  // Stale-while-revalidate: keep the last report rendered during a refetch.
  const ready = Boolean(data)
  const stale = Boolean(data) && loading
  const cats = data?.categoryScores ?? []
  const best = data?.takeaways?.find(t => t.type === 'positive')
  const worst = data?.takeaways?.find(t => t.type === 'negative')

  return (
    <section ref={wrapRef} className="relative max-w-6xl mx-auto px-6 py-24 sm:py-32">
      <div className="max-w-2xl">
        <h2 className="t-section" style={{ color: 'var(--text)' }}>
          Pick a ticker. <span style={{ color: '#5FBF8A' }}>Watch it score.</span>
        </h2>
        <p className="t-lead mt-4">
          This is the real engine, running live on this page. It reads the filings, the price action
          and the analyst tape, scores six things that decide whether a business is worth owning, and
          shows you the reasoning behind every point.
        </p>
      </div>

      {/* Ticker selector */}
      <div className="mt-8 flex flex-wrap gap-2">
        {TICKERS.map(({ t, n }) => {
          const on = t === ticker
          return (
            <button
              key={t}
              onClick={() => setTicker(t)}
              aria-pressed={on}
              className="group inline-flex items-baseline gap-2 rounded-full transition-all"
              style={{
                padding: '0.6rem 1.05rem',
                background: on ? 'linear-gradient(180deg, #4FC98D 0%, #2E9466 100%)' : 'rgba(255,255,255,0.04)',
                color: on ? '#06140D' : 'var(--text-2)',
                border: `1px solid ${on ? 'transparent' : 'var(--border-2)'}`,
                boxShadow: on ? '0 8px 22px rgba(46,148,102,0.34)' : 'none',
              }}
            >
              <span className="t-num" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{t}</span>
              <span style={{ fontSize: '0.72rem', opacity: on ? 0.75 : 0.6 }}>{n}</span>
            </button>
          )
        })}
      </div>

      {/* The product itself */}
      <div style={{ perspective: 1600 }} className="mt-7">
        <motion.div
          ref={panelRef}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          className="relative overflow-hidden rounded-[22px]"
          style={{
            rotateX: reduced ? 0 : rotateX,
            rotateY: reduced ? 0 : rotateY,
            transformStyle: 'preserve-3d',
            background: 'linear-gradient(180deg, rgba(20,23,29,0.96) 0%, rgba(10,11,14,0.99) 100%)',
            border: '1px solid rgba(96,108,126,0.34)',
            boxShadow: '0 50px 120px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.08)',
            minHeight: 430,
          }}
        >
          {/* light catching the top edge + cursor glare: real material, not glass-for-the-sake-of-it */}
          <span aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.34), transparent)' }} />
          {!reduced && (
            <motion.span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: glare }} />
          )}

          {/* header */}
          <div
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-6 sm:px-8 pt-6 pb-5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="min-w-0">
              <p style={{ fontSize: '1.08rem', color: 'var(--text)', fontWeight: 600, letterSpacing: '-0.01em' }}>
                {data?.companyName ?? (loading ? 'Running the engine…' : ticker)}
              </p>
              <p className="t-label mt-0.5">
                {loading
                  ? `Scoring ${ticker}…`
                  : data
                    ? `${data.ticker} · ${data.sector ?? '—'}`
                    : `${ticker} · fetching`}
              </p>
            </div>
            {data?.currentPrice != null && (
              <p className="t-num" style={{ fontSize: '1.05rem', color: 'var(--text)' }}>
                ${data.currentPrice.toFixed(2)}
              </p>
            )}
          </div>

          {/* body */}
          <div
            className="px-6 sm:px-8 py-7 transition-opacity duration-300"
            style={{ opacity: stale ? 0.45 : 1 }}
          >
            {failed ? (
              <p className="t-body">
                The analysis engine is not reachable right now. Start the backend on port 8000 and this
                panel will run live.
              </p>
            ) : (
              <div className="grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)] items-start">
                {/* score + verdict */}
                <div className="flex items-center gap-6 lg:flex-col lg:items-start lg:gap-4">
                  <ScoreDial score={data?.overallScore ?? 0} active={ready} />
                  <div className="lg:mt-1">
                    <p style={{ fontSize: '1.02rem', color: '#5FBF8A', fontWeight: 600, letterSpacing: '-0.01em' }}>
                      {data?.ratingLabel ?? '—'}
                    </p>
                    <p className="t-body mt-1" style={{ maxWidth: '20ch', fontSize: '0.88rem' }}>
                      {data?.nuancedLabel ?? ''}
                    </p>
                  </div>
                </div>

                {/* the receipts */}
                <div className="min-w-0">
                  <div className="grid gap-3.5">
                    {cats.map((c, i) => (
                      <CategoryRow key={c.key} c={c} i={i} active={ready} />
                    ))}
                    {!cats.length && (
                      <div className="grid gap-3.5" aria-hidden>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="h-[30px] rounded-md" style={{ background: 'rgba(255,255,255,0.035)' }} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* the cold take */}
                  {ready && data && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.62 }}
                      className="mt-6 pt-5"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <p style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.6 }}>
                        <span className="t-label" style={{ color: '#5FBF8A', marginRight: 8 }}>COLD TAKE</span>
                        {data.oneLineVerdict}
                      </p>
                      <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                        {best && (
                          <p className="t-body" style={{ fontSize: '0.83rem' }}>
                            <span style={{ color: '#5FBF8A' }}>Best argument. </span>{best.text}
                          </p>
                        )}
                        {worst && (
                          <p className="t-body" style={{ fontSize: '0.83rem' }}>
                            <span style={{ color: '#D98A6A' }}>Biggest risk. </span>{worst.text}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* running indicator */}
          {loading && (
            <motion.span
              aria-hidden
              className="absolute bottom-0 left-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg, transparent, #5FD3A0, transparent)' }}
              initial={{ width: '12%', x: '-12%' }}
              animate={{ x: ['-12%', '860%'] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </motion.div>
      </div>
    </section>
  )
}
