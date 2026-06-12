'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  motion, AnimatePresence, useReducedMotion, useMotionValue, useSpring,
} from 'motion/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DECK_UNIVERSE, DeckEntry } from '@/lib/deck'
import { fetchReportCached, getCachedReport } from '@/lib/reportCache'
import { RatingResponse, ChartDataPoint } from '@/lib/types'
import { useWatchlist } from '@/lib/watchlist'
import { cleanText } from '@/lib/utils'
import { DiscoverChamber } from '@/components/DiscoverChamber'
import { MarketCursorFollower } from '@/components/MarketCursorFollower'
import { WatchlistControl } from '@/components/WatchlistControl'
import { StockLogo } from '@/components/StockLogo'
import { StonkyMark } from '@/components/StonkyMark'

// Graphite cockpit shell: the Discover card uses the SAME dark card system
// as the report page, so the whole product reads as one terminal.
const PANEL = 'linear-gradient(180deg, rgba(26,29,36,0.92) 0%, rgba(15,17,21,0.96) 100%)'
const INK = 'var(--text)'
const SUB = 'var(--text-2)'
const MUTED = 'var(--muted)'
const POS = '#2E9466'
const NEG = '#B23A3A'
const GOLD = '#C9A24C'

// Each stock tints the chamber's aura with its own color.
const AURAS = ['#5FA8A0', '#C9A24C', '#3E9466', '#8E7CC3', '#5B7BA8', '#C96A4C']
function auraFor(symbol: string): string {
  let h = 0
  for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) | 0
  return AURAS[Math.abs(h) % AURAS.length]
}

type ReportState = RatingResponse | 'failed' | undefined

function biasLabel(report: RatingResponse): string {
  if (report.longTermThesisBias?.label) return report.longTermThesisBias.label
  const s = report.overallScore
  if (s >= 70) return 'Bullish'
  if (s >= 58) return 'Cautiously bullish'
  if (s >= 45) return 'Cautiously bearish'
  return 'Bearish'
}

function biasInk(label: string): string {
  return label.toLowerCase().includes('bull') ? POS : NEG
}

function MemoRow({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 3 }}>
        {label}
      </p>
      <p style={{ fontSize: '0.9rem', lineHeight: 1.55, color: SUB }}>{text}</p>
    </div>
  )
}

/** Real 1Y sparkline drawn from the report's bundled chart data. */
function CardSparkline({ data }: { data: ChartDataPoint[] }) {
  const spark = useMemo(() => {
    const closes = (data || []).map(d => d.close ?? d.price).filter((v): v is number => v != null)
    if (closes.length < 8) return null
    const step = Math.max(1, Math.floor(closes.length / 90))
    const pts = closes.filter((_, i) => i % step === 0)
    const min = Math.min(...pts)
    const max = Math.max(...pts)
    const span = max - min || 1
    const path = pts.map((v, i) => `${(i / (pts.length - 1)) * 100},${30 - ((v - min) / span) * 26 - 2}`).join(' ')
    return { path, up: pts[pts.length - 1] >= pts[0] }
  }, [data])

  if (!spark) return null
  const color = spark.up ? POS : NEG
  return (
    <div className="flex items-center gap-2.5 mt-1 mb-5">
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="flex-1" style={{ height: 34 }} aria-hidden>
        <polyline points={spark.path} fill="none" stroke={color} strokeWidth="1.3" opacity="0.9" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span style={{ fontSize: '0.6rem', color: MUTED, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>1Y</span>
    </div>
  )
}

/** Cursor tilt: the floating card leans toward the pointer, spring-settled. */
function TiltCard({ children, disabled }: { children: React.ReactNode; disabled: boolean }) {
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 160, damping: 20 })
  const sry = useSpring(ry, { stiffness: 160, damping: 20 })

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    ry.set((px - 0.5) * 6)
    rx.set(-(py - 0.5) * 4.5)
  }
  const onLeave = () => { rx.set(0); ry.set(0) }

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={disabled ? undefined : { rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d', transformPerspective: 1000 }}
    >
      {children}
    </motion.div>
  )
}

function DeckCard({ entry, report, saved, accent }: { entry: DeckEntry; report: RatingResponse; saved: boolean; accent: string }) {
  const bias = biasLabel(report)
  const risk =
    report.investmentThesis?.bearCase?.[0] ||
    report.drags?.[0] ||
    'Valuation and execution risk.'
  const coldTake = cleanText(report.nuancedLabel || report.oneLineVerdict || '')

  return (
    <div
      className="relative overflow-hidden select-none"
      style={{
        background: PANEL,
        border: '1px solid var(--border-2)',
        borderRadius: 18,
        boxShadow: `0 40px 90px rgba(0,0,0,0.7), 0 0 90px ${accent}2E, inset 0 1px 0 rgba(236,231,223,0.05)`,
        color: INK,
        transformStyle: 'preserve-3d',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, height: 3, width: '100%', background: `linear-gradient(90deg, ${accent} 0%, transparent 65%)`, opacity: 0.7 }} />

      <div style={{ padding: 'clamp(1.4rem, 3.6vw, 2rem)', transform: 'translateZ(0)' }}>
        {/* The reveal moment: big logo with the stock's aura glowing behind it */}
        <div className="flex items-start justify-between gap-4 mb-4" style={{ transform: 'translateZ(28px)' }}>
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div
                aria-hidden
                style={{
                  position: 'absolute', inset: -16, borderRadius: 999,
                  background: `radial-gradient(circle, ${accent}38 0%, transparent 70%)`,
                  filter: 'blur(10px)',
                }}
              />
              <StockLogo symbol={entry.symbol} size={72} radius={18} glow />
            </div>
            <div>
              <h2 className="font-semibold leading-tight" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.7rem)', letterSpacing: '-0.025em', color: INK }}>
                {report.companyName || entry.name}
              </h2>
              <p className="mt-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: MUTED, letterSpacing: '0.08em' }}>
                {entry.symbol}{report.sector ? `  ·  ${report.sector}` : ''}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.9rem', fontWeight: 600, lineHeight: 1, color: INK }}>
              {report.overallScore}
            </p>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.16em', color: MUTED, marginTop: 2 }}>SCORE / 100</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-3" style={{ transform: 'translateZ(18px)' }}>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ color: biasInk(bias), background: 'rgba(236,231,223,0.06)' }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 999, background: biasInk(bias), display: 'inline-block' }} />
            Long-term thesis bias: {bias}
          </span>
          {saved && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ color: GOLD, background: 'rgba(201,162,76,0.1)' }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 999, background: GOLD, display: 'inline-block' }} />
              Saved
            </span>
          )}
        </div>

        <div style={{ transform: 'translateZ(12px)' }}>
          <CardSparkline data={report.chartData} />
        </div>

        <div className="space-y-3.5" style={{ transform: 'translateZ(10px)' }}>
          <MemoRow label="What it does" text={entry.whatItDoes} />
          <MemoRow label="Best thing" text={entry.bestThing} />
          <MemoRow label="Unique edge" text={entry.uniqueEdge} />
          <MemoRow label="Main risk" text={cleanText(risk)} />
        </div>

        {coldTake && (
          <p
            className="mt-5 pt-4"
            style={{ borderTop: '1px solid rgba(236,231,223,0.08)', fontSize: '0.98rem', fontWeight: 600, letterSpacing: '-0.01em', color: INK, transform: 'translateZ(16px)' }}
          >
            Cold take: <span style={{ fontWeight: 500, color: SUB }}>{coldTake}</span>
          </p>
        )}
      </div>
    </div>
  )
}

function LoadingCard({ symbol }: { symbol: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4"
      style={{ background: PANEL, border: '1px solid var(--border-2)', borderRadius: 18, minHeight: 420, boxShadow: 'var(--shadow-lg)' }}
    >
      <span className="rr-scroll-pulse" style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--accent)', display: 'inline-block' }} />
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: SUB, letterSpacing: '0.1em' }}>
        Scoring {symbol}
      </p>
      <p className="text-xs" style={{ color: MUTED }}>Running the six tests on live data.</p>
    </div>
  )
}

export default function DiscoverPage() {
  const router = useRouter()
  const reduced = useReducedMotion()
  const [idx, setIdx] = useState(0)
  const [reports, setReports] = useState<Record<string, ReportState>>({})
  const { items: watch, save, has } = useWatchlist()
  const [skippedNote, setSkippedNote] = useState<string | null>(null)
  const fetchingRef = useRef<Set<string>>(new Set())

  const deck = DECK_UNIVERSE
  const current = idx < deck.length ? deck[idx] : null
  const currentReport: ReportState = current ? reports[current.symbol] : undefined
  const accent = current ? auraFor(current.symbol) : '#5FA8A0'

  const ensureReport = useCallback((symbol: string) => {
    const cached = getCachedReport(symbol)
    if (cached) {
      setReports(prev => (prev[symbol] ? prev : { ...prev, [symbol]: cached }))
      return Promise.resolve()
    }
    if (fetchingRef.current.has(symbol)) return Promise.resolve()
    fetchingRef.current.add(symbol)
    return fetchReportCached(symbol)
      .then(data => setReports(prev => ({ ...prev, [symbol]: data })))
      .catch(() => setReports(prev => ({ ...prev, [symbol]: 'failed' })))
      .finally(() => fetchingRef.current.delete(symbol))
  }, [])

  // Load the current card first, then quietly prefetch the next two.
  // Sequential on purpose: the backend is never hit with a burst.
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      for (let offset = 0; offset <= 2; offset++) {
        if (cancelled) return
        const entry = deck[idx + offset]
        if (!entry) return
        await ensureReport(entry.symbol)
      }
    }
    run()
    return () => { cancelled = true }
  }, [idx, deck, ensureReport])

  // Cards always travel left to right: the current one exits stage right,
  // the next enters from stage left, like a reveal conveyor.
  const advance = useCallback(() => {
    setIdx(i => i + 1)
  }, [])

  const skip = useCallback(() => {
    setSkippedNote(null)
    advance()
  }, [advance])

  const addCurrent = useCallback(() => {
    if (!current || !currentReport || currentReport === 'failed') return
    save({
      symbol: current.symbol,
      name: currentReport.companyName || current.name,
      score: currentReport.overallScore,
      bias: biasLabel(currentReport),
    })
    advance()
  }, [current, currentReport, save, advance])

  const deepDive = useCallback((symbol: string) => {
    router.push(`/?ticker=${encodeURIComponent(symbol)}`)
  }, [router])

  // A ticker with no data is skipped gracefully, never a crash.
  useEffect(() => {
    if (current && currentReport === 'failed') {
      setSkippedNote(`${current.symbol} skipped: data unavailable for this ticker.`)
      const t = setTimeout(() => advance(), 350)
      return () => clearTimeout(t)
    }
  }, [current, currentReport, advance])

  // Keyboard: left = skip, right = watchlist, Enter = deep dive.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!current || !currentReport || currentReport === 'failed') return
      if (e.key === 'ArrowLeft') { e.preventDefault(); skip() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); addCurrent() }
      else if (e.key === 'Enter') { e.preventDefault(); deepDive(current.symbol) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, currentReport, skip, addCurrent, deepDive])

  const watched = current ? has(current.symbol) : false

  return (
    <>
      {/* The chamber: Three.js starfield, mist, and the stock's aura.
          Falls back to the 2D space stage without WebGL or with reduced motion. */}
      <DiscoverChamber accent={accent} />
      <MarketCursorFollower intensity="full" />

      <div className="min-h-screen relative z-20 flex flex-col">
        {/* Minimal header */}
        <header
          className="sticky top-0 z-40 px-6 py-3.5"
          style={{ background: 'rgba(7,7,9,0.7)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" aria-label="Stonky home">
                <StonkyMark size={24} />
              </Link>
              <span className="hidden sm:inline text-xs" style={{ color: 'var(--faint)' }}>Discovery Chamber</span>
            </div>
            <div className="flex items-center gap-5">
              <Link
                href="/"
                className="text-xs transition-colors"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >
                New search
              </Link>
              <WatchlistControl />
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-2xl mx-auto w-full">
          <div className="text-center mb-9">
            <p className="eyebrow mb-3" style={{ color: 'var(--accent)' }}>Discover</p>
            <h1 className="font-semibold" style={{ color: 'var(--text)', fontSize: 'clamp(1.6rem, 3.6vw, 2.2rem)', letterSpacing: '-0.03em' }}>
              One stock at a time.
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
              Skip it, save it, or open the full report. Arrow keys work too.
            </p>
          </div>

          <div className="relative w-full" style={{ minHeight: 500, perspective: 1300 }}>
            <AnimatePresence mode="popLayout">
              {current ? (
                <motion.div
                  key={current.symbol}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, x: -380, scale: 0.92, rotateY: 12, filter: 'blur(10px)' }}
                  animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1, y: 0, rotate: 0, rotateY: 0, filter: 'blur(0px)' }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, x: 420, scale: 0.95, rotateY: -10, filter: 'blur(8px)' }}
                  transition={{ duration: reduced ? 0.2 : 0.65, ease: [0.22, 1, 0.36, 1] }}
                  drag={!reduced && currentReport && currentReport !== 'failed' ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.6}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -120) skip()
                    else if (info.offset.x > 120) addCurrent()
                  }}
                  style={{ cursor: currentReport && currentReport !== 'failed' ? 'grab' : 'default' }}
                >
                  {currentReport && currentReport !== 'failed' ? (
                    <motion.div
                      animate={reduced ? undefined : { y: [0, -7, 0] }}
                      transition={reduced ? undefined : { duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <TiltCard disabled={!!reduced}>
                        <DeckCard entry={current} report={currentReport} saved={watched} accent={accent} />
                      </TiltCard>
                    </motion.div>
                  ) : (
                    <LoadingCard symbol={current.symbol} />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="deck-end"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center justify-center text-center gap-5"
                  style={{ background: PANEL, border: '1px solid var(--border-2)', borderRadius: 18, minHeight: 420, color: INK, boxShadow: '0 40px 90px rgba(0,0,0,0.6)' }}
                >
                  <p className="font-semibold" style={{ fontSize: '1.4rem', letterSpacing: '-0.02em' }}>
                    That is the whole deck.
                  </p>
                  <p style={{ fontSize: '0.92rem', color: SUB, maxWidth: 380, lineHeight: 1.6 }}>
                    {watch.length > 0
                      ? `You saved ${watch.length} ${watch.length === 1 ? 'stock' : 'stocks'}. Open the watchlist to deep dive.`
                      : 'Nothing saved this round. Run it again or search a ticker directly.'}
                  </p>
                  <button
                    onClick={() => setIdx(0)}
                    className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
                    style={{ background: 'linear-gradient(180deg, var(--ivory) 0%, var(--ivory-2) 100%)', color: 'var(--ink)' }}
                  >
                    Restart deck
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {skippedNote && (
            <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>{skippedNote}</p>
          )}

          {/* Actions */}
          {current && (
            <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
              <button
                onClick={skip}
                className="px-5 py-2.5 rounded-full text-sm transition-all"
                style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-2)' }}
              >
                Skip
              </button>
              <button
                onClick={addCurrent}
                disabled={!currentReport || currentReport === 'failed'}
                className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: watched ? 'var(--surface-2)' : 'var(--accent-bg)',
                  color: watched ? 'var(--muted)' : 'var(--accent-2)',
                  opacity: !currentReport || currentReport === 'failed' ? 0.5 : 1,
                }}
              >
                {watched ? 'In watchlist' : 'Add to watchlist'}
              </button>
              <button
                onClick={() => current && deepDive(current.symbol)}
                disabled={!currentReport || currentReport === 'failed'}
                className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: 'linear-gradient(180deg, var(--ivory) 0%, var(--ivory-2) 100%)',
                  color: 'var(--ink)',
                  opacity: !currentReport || currentReport === 'failed' ? 0.5 : 1,
                }}
              >
                Deep dive
              </button>
            </div>
          )}

          <p className="text-xs mt-10 text-center max-w-md" style={{ color: 'var(--faint)', lineHeight: 1.6 }}>
            Educational scores from public data. Not a recommendation to buy, sell, or hold any security.
          </p>
        </main>
      </div>
    </>
  )
}
