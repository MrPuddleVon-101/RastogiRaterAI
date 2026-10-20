'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { Heart, SkipForward, ArrowUpRight, Bookmark } from 'lucide-react'
import { DeckEntry } from '@/lib/deck'
import { fetchReportCached, getCachedReport } from '@/lib/reportCache'
import { RatingResponse, ChartDataPoint } from '@/lib/types'
import { useWatchlist } from '@/lib/watchlist'
import { cleanText } from '@/lib/utils'
import { StockLogo } from '@/components/StockLogo'

const PANEL = 'linear-gradient(180deg, rgba(20,26,23,0.94) 0%, rgba(12,15,13,0.97) 100%)'
const INK = 'var(--text)'
const SUB = 'var(--text-2)'
const MUTED = 'var(--muted)'
const POS = '#2E9466'
const NEG = '#B23A3A'
const EMER = '#3FB07C'

type ReportState = RatingResponse | 'failed' | undefined

function biasLabel(r: RatingResponse): string {
  if (r.longTermThesisBias?.label) return r.longTermThesisBias.label
  const s = r.overallScore
  if (s >= 70) return 'Bullish'
  if (s >= 58) return 'Cautiously bullish'
  if (s >= 45) return 'Cautiously bearish'
  return 'Bearish'
}
const biasInk = (l: string) => (l.toLowerCase().includes('bull') ? POS : NEG)

function MemoRow({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: EMER, marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: '0.9rem', lineHeight: 1.55, color: SUB }}>{text}</p>
    </div>
  )
}

function CardSparkline({ data }: { data: ChartDataPoint[] }) {
  const spark = useMemo(() => {
    const closes = (data || []).map(d => d.close ?? d.price).filter((v): v is number => v != null)
    if (closes.length < 8) return null
    const step = Math.max(1, Math.floor(closes.length / 90))
    const pts = closes.filter((_, i) => i % step === 0)
    const min = Math.min(...pts), max = Math.max(...pts)
    const span = max - min || 1
    const path = pts.map((v, i) => `${(i / (pts.length - 1)) * 100},${30 - ((v - min) / span) * 26 - 2}`).join(' ')
    return { path, up: pts[pts.length - 1] >= pts[0] }
  }, [data])
  if (!spark) return null
  const color = spark.up ? POS : NEG
  return (
    <div className="mb-5 mt-1 flex items-center gap-2.5">
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="flex-1" style={{ height: 34 }} aria-hidden>
        <polyline points={spark.path} fill="none" stroke={color} strokeWidth="1.3" opacity="0.9" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span style={{ fontSize: '0.6rem', color: MUTED, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>1Y</span>
    </div>
  )
}

function DeckCard({ entry, report, saved }: { entry: DeckEntry; report: RatingResponse; saved: boolean }) {
  const bias = biasLabel(report)
  const risk = report.investmentThesis?.bearCase?.[0] || report.drags?.[0] || 'Valuation and execution risk.'
  const coldTake = cleanText(report.nuancedLabel || report.oneLineVerdict || '')
  return (
    <div className="relative select-none overflow-hidden" style={{ background: PANEL, border: '1px solid rgba(63,176,124,0.18)', borderRadius: 18, boxShadow: `0 40px 90px rgba(0,0,0,0.7), 0 0 70px rgba(46,148,102,0.16)`, color: INK }}>
      <div style={{ position: 'absolute', left: 0, top: 0, height: 3, width: '100%', background: `linear-gradient(90deg, ${EMER} 0%, transparent 65%)`, opacity: 0.8 }} />
      <div style={{ padding: 'clamp(1.4rem, 3.6vw, 2rem)' }}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div aria-hidden style={{ position: 'absolute', inset: -16, borderRadius: 999, background: `radial-gradient(circle, rgba(46,148,102,0.34) 0%, transparent 70%)`, filter: 'blur(10px)' }} />
              <StockLogo symbol={entry.symbol} size={72} radius={18} glow />
            </div>
            <div>
              <h2 className="font-semibold leading-tight" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.7rem)', letterSpacing: '-0.025em', color: INK }}>{report.companyName || entry.name}</h2>
              <p className="mt-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: MUTED, letterSpacing: '0.08em' }}>{entry.symbol}{report.sector ? `  ·  ${report.sector}` : ''}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.9rem', fontWeight: 600, lineHeight: 1, color: INK }}>{report.overallScore}</p>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.16em', color: MUTED, marginTop: 2 }}>SCORE / 100</p>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ color: biasInk(bias), background: 'rgba(255,255,255,0.05)' }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: biasInk(bias), display: 'inline-block' }} />
            Long-term thesis bias: {bias}
          </span>
          {saved && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ color: EMER, background: 'rgba(46,148,102,0.12)' }}>
              <Bookmark className="h-3 w-3" /> Saved
            </span>
          )}
        </div>

        <CardSparkline data={report.chartData} />

        <div className="space-y-3.5">
          <MemoRow label="What it does" text={entry.whatItDoes} />
          <MemoRow label="Best thing" text={entry.bestThing} />
          <MemoRow label="Unique edge" text={entry.uniqueEdge} />
          <MemoRow label="Main risk" text={cleanText(risk)} />
        </div>

        {coldTake && (
          <p className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.98rem', fontWeight: 600, letterSpacing: '-0.01em', color: INK }}>
            Cold take: <span style={{ fontWeight: 500, color: SUB }}>{coldTake}</span>
          </p>
        )}
      </div>
    </div>
  )
}

function LoadingCard({ symbol }: { symbol: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4" style={{ background: PANEL, border: '1px solid rgba(63,176,124,0.18)', borderRadius: 18, minHeight: 420 }}>
      <motion.span style={{ width: 9, height: 9, borderRadius: 999, background: EMER, display: 'inline-block' }} animate={{ opacity: [0.4, 1, 0.4], scale: [0.85, 1.1, 0.85] }} transition={{ duration: 1.1, repeat: Infinity }} />
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: SUB, letterSpacing: '0.1em' }}>Ticky is scoring {symbol}</p>
    </div>
  )
}

interface TickyDeckProps {
  deck: DeckEntry[]
  summary: string
  onReset: () => void
}

export function TickyDeck({ deck, summary, onReset }: TickyDeckProps) {
  const router = useRouter()
  const reduced = useReducedMotion()
  const { items: wish, save, has } = useWatchlist()
  const [idx, setIdx] = useState(0)
  const [reports, setReports] = useState<Record<string, ReportState>>({})
  const fetchingRef = useRef<Set<string>>(new Set())

  const current = idx < deck.length ? deck[idx] : null
  const currentReport: ReportState = current ? reports[current.symbol] : undefined

  const ensureReport = useCallback((symbol: string) => {
    const cached = getCachedReport(symbol)
    if (cached) { setReports(prev => (prev[symbol] ? prev : { ...prev, [symbol]: cached })); return Promise.resolve() }
    if (fetchingRef.current.has(symbol)) return Promise.resolve()
    fetchingRef.current.add(symbol)
    return fetchReportCached(symbol)
      .then(data => setReports(prev => ({ ...prev, [symbol]: data })))
      .catch(() => setReports(prev => ({ ...prev, [symbol]: 'failed' })))
      .finally(() => fetchingRef.current.delete(symbol))
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      for (let o = 0; o <= 2; o++) {
        if (cancelled) return
        const e = deck[idx + o]
        if (!e) return
        await ensureReport(e.symbol)
      }
    }
    run()
    return () => { cancelled = true }
  }, [idx, deck, ensureReport])

  const advance = useCallback(() => setIdx(i => i + 1), [])
  const skip = advance
  const addCurrent = useCallback(() => {
    if (!current || !currentReport || currentReport === 'failed') return
    save({ ticker: current.symbol, name: currentReport.companyName || current.name, score: currentReport.overallScore, rating: biasLabel(currentReport) })
    advance()
  }, [current, currentReport, save, advance])
  const deepDive = useCallback((symbol: string) => router.push(`/?ticker=${encodeURIComponent(symbol)}`), [router])

  // skip a ticker with no data, never crash
  useEffect(() => {
    if (current && currentReport === 'failed') {
      const t = setTimeout(() => advance(), 300)
      return () => clearTimeout(t)
    }
  }, [current, currentReport, advance])

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
    <div className="relative z-20 mx-auto flex w-full max-w-2xl flex-col items-center px-6 pb-16 pt-6">
      {/* deck header */}
      <div className="mb-6 w-full text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: EMER }}>Ticky&apos;s Stock Deck</p>
        <p className="mx-auto max-w-md text-sm" style={{ color: SUB }}>{summary}</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button onClick={onReset} className="rounded-full px-4 py-2 text-xs font-medium transition-colors" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-2)' }}>Ask Ticky again</button>
          {wish.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold" style={{ background: 'rgba(46,148,102,0.12)', color: EMER }}>
              <Heart className="h-3.5 w-3.5" /> {wish.length} saved
            </span>
          )}
        </div>
      </div>

      <div className="relative w-full" style={{ minHeight: 500, perspective: 1300 }}>
        <AnimatePresence mode="popLayout">
          {current ? (
            <motion.div
              key={current.symbol}
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: '-110vw', scale: 0.9, rotateY: 14 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1, rotateY: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: '110vw', scale: 0.92, rotateY: -14 }}
              transition={{ duration: reduced ? 0.2 : 0.6, ease: [0.22, 1, 0.36, 1] }}
              drag={!reduced && currentReport && currentReport !== 'failed' ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => { if (info.offset.x < -120) skip(); else if (info.offset.x > 120) addCurrent() }}
              style={{ cursor: currentReport && currentReport !== 'failed' ? 'grab' : 'default' }}
            >
              {currentReport && currentReport !== 'failed' ? (
                <motion.div animate={reduced ? undefined : { y: [0, -7, 0] }} transition={reduced ? undefined : { duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}>
                  <DeckCard entry={current} report={currentReport} saved={watched} />
                </motion.div>
              ) : (
                <LoadingCard symbol={current.symbol} />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="deck-end"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center gap-5 text-center"
              style={{ background: PANEL, border: '1px solid rgba(63,176,124,0.18)', borderRadius: 18, minHeight: 420, color: INK, padding: '2rem' }}
            >
              <p className="text-xl font-semibold" style={{ letterSpacing: '-0.02em' }}>That is the whole deck.</p>
              <p style={{ fontSize: '0.92rem', color: SUB, maxWidth: 380, lineHeight: 1.6 }}>
                {wish.length > 0 ? `You saved ${wish.length} ${wish.length === 1 ? 'stock' : 'stocks'} to your watchlist. Open it from the top right to deep dive.` : 'Nothing saved this round. Ask Ticky for a different angle.'}
              </p>
              <button onClick={onReset} className="rounded-full px-5 py-2.5 text-sm font-semibold" style={{ background: 'linear-gradient(180deg, #3FB07C 0%, #2E9466 100%)', color: '#06140d' }}>Ask Ticky again</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* actions */}
      {current && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button onClick={skip} className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm transition-colors" style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
            <SkipForward className="h-4 w-4" /> Skip
          </button>
          <button onClick={addCurrent} disabled={!currentReport || currentReport === 'failed'} className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
            style={{ background: watched ? 'var(--surface-2)' : 'rgba(46,148,102,0.14)', color: watched ? 'var(--muted)' : EMER, opacity: !currentReport || currentReport === 'failed' ? 0.5 : 1 }}>
            <Heart className="h-4 w-4" /> {watched ? 'In watchlist' : 'Add to watchlist'}
          </button>
          <button onClick={() => current && deepDive(current.symbol)} disabled={!currentReport || currentReport === 'failed'} className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
            style={{ background: 'linear-gradient(180deg, var(--ivory) 0%, var(--ivory-2) 100%)', color: 'var(--ink)', opacity: !currentReport || currentReport === 'failed' ? 0.5 : 1 }}>
            <ArrowUpRight className="h-4 w-4" /> Deep dive
          </button>
        </div>
      )}

      <p className="mt-10 max-w-md text-center text-xs" style={{ color: 'var(--faint)', lineHeight: 1.6 }}>
        Educational scores from public data. Not a recommendation to buy, sell, or hold any security.
      </p>
    </div>
  )
}
