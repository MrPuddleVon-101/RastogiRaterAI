'use client'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip,
  ReferenceLine, ReferenceArea, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { ChartDataPoint, ChartRead, ChartRange, SearchResult } from '@/lib/types'
import { fetchChart, searchSymbols } from '@/lib/api'
import { detectCandlePattern, Bias } from '@/lib/candlePatterns'
import { cleanText, currencySymbol } from '@/lib/utils'

// The cockpit chart: the main research surface. Dark terminal shell, animated
// delta readout, 1D..MAX ranges, multi-ticker compare with a normalized
// percentage view, drag-select zoom with pan nudges, and a fullscreen surface.

interface CockpitChartProps {
  ticker: string
  data: ChartDataPoint[]          // 1Y daily window shipped with the report
  chartRead: ChartRead
  hi52?: number | null
  currency?: string
}

const RANGES: ChartRange[] = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', 'MAX']
const RANGE_LABEL: Record<string, string> = {
  '1D': 'today', '5D': 'over 5D', '1M': 'over 1M', '6M': 'over 6M',
  YTD: 'YTD', '1Y': 'over 1Y', '5Y': 'over 5Y', MAX: 'all time',
}

const INK = '#ECE7DF'
const MUTED = '#6A6E78'
const GRID = 'rgba(236,231,223,0.06)'
const POS = '#2E9466'
const NEG = '#B23A3A'
const GOLD = '#C9A24C'
const COMPARE_COLORS = ['#C9A24C', '#5FA8A0', '#8E7CC3', '#C96A4C']
const MAX_COMPARES = 4

// Session cache so range/compare switching never refetches the same series.
const seriesCache = new Map<string, ChartDataPoint[]>()

function cacheKey(sym: string, range: ChartRange) { return `${sym}|${range}` }

function isIntraday(range: ChartRange) { return range === '1D' || range === '5D' }

function fmtAxis(date: string, range: ChartRange): string {
  if (isIntraday(range)) {
    const time = date.slice(11, 16)
    if (range === '1D') return time
    const d = new Date(date.slice(0, 10) + 'T00:00:00')
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${time}`
  }
  const d = new Date(date + 'T00:00:00')
  if (range === '1M' || range === '6M' || range === 'YTD') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function fmtTooltipDate(date: string, range: ChartRange): string {
  if (isIntraday(range)) {
    const d = new Date(date.slice(0, 10) + 'T00:00:00')
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${date.slice(11, 16)}`
  }
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Per-character staggered readout: the delta types itself in on change. */
function AnimatedDelta({ text, color, reduced }: { text: string; color: string; reduced: boolean }) {
  if (reduced) {
    return <span style={{ color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{text}</span>
  }
  return (
    <span key={text} style={{ color, fontFamily: 'var(--font-mono)', fontWeight: 600, display: 'inline-flex' }}>
      {text.split('').map((ch, i) => (
        <motion.span
          key={`${i}-${ch}`}
          initial={{ opacity: 0, y: 7 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.016, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {ch === ' ' ? ' ' : ch}
        </motion.span>
      ))}
    </span>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Candle(props: any) {
  const { x, y, width, height, payload } = props
  const { open, close, high, low } = payload || {}
  if (open == null || close == null || high == null || low == null) return null
  const span = (high - low) || 1
  const up = close >= open
  const color = up ? POS : NEG
  const pxFor = (v: number) => y + ((high - v) / span) * height
  const bodyTop = pxFor(Math.max(open, close))
  const bodyBottom = pxFor(Math.min(open, close))
  const cx = x + width / 2
  const bodyW = Math.max(1.5, Math.min(width * 0.62, 12))
  return (
    <g>
      <line x1={cx} x2={cx} y1={y} y2={y + height} stroke={color} strokeWidth={1} opacity={0.85} />
      <rect x={cx - bodyW / 2} y={bodyTop} width={bodyW} height={Math.max(1, bodyBottom - bodyTop)} fill={color} opacity={0.95} />
    </g>
  )
}

function biasColor(b: Bias): string { return b === 'bullish' ? POS : NEG }
function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1) }

interface SeriesInfo { key: string; symbol: string; color: string }

export function CockpitChart({ ticker, data, chartRead, hi52, currency = 'USD' }: CockpitChartProps) {
  const reduced = useReducedMotion() ?? false
  const [range, setRange] = useState<ChartRange>('1Y')
  const [view, setView] = useState<'Line' | 'Candle'>('Line')
  const [mode, setMode] = useState<'$' | '%'>('$')
  const [compares, setCompares] = useState<string[]>([])
  const [compareInput, setCompareInput] = useState('')
  const [compareError, setCompareError] = useState<string | null>(null)
  const [compareSugs, setCompareSugs] = useState<SearchResult[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const [fsH, setFsH] = useState(480)
  const [bump, setBump] = useState(0) // re-render trigger after async cache fills
  const [loading, setLoading] = useState(false)
  const [failedRange, setFailedRange] = useState(false)
  const [zoom, setZoom] = useState<{ start: number; end: number } | null>(null)
  const [dragSel, setDragSel] = useState<{ from: number; to: number } | null>(null)
  const dragRef = useRef<number | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [ov, setOv] = useState({ ma50: true, ma200: true, hi52: true })

  // Seed the cache with the report's bundled 1Y window.
  if (!seriesCache.has(cacheKey(ticker, '1Y')) && data?.length) {
    seriesCache.set(cacheKey(ticker, '1Y'), data)
  }

  // Ensure every needed series (primary + compares) exists for the range.
  useEffect(() => {
    let cancelled = false
    const symbols = [ticker, ...compares]
    const missing = symbols.filter(s => !seriesCache.has(cacheKey(s, range)))
    if (missing.length === 0) { setLoading(false); setFailedRange(false); return }
    setLoading(true)
    setFailedRange(false)
    const run = async () => {
      for (const sym of missing) {
        if (cancelled) return
        try {
          const res = await fetchChart(sym, range)
          seriesCache.set(cacheKey(sym, range), res.chartData || [])
        } catch {
          seriesCache.set(cacheKey(sym, range), [])
          if (sym === ticker && !cancelled) setFailedRange(true)
          if (sym !== ticker && !cancelled) {
            setCompareError(`Could not load ${sym} for this range.`)
          }
        }
        if (!cancelled) setBump(b => b + 1)
      }
      if (!cancelled) setLoading(false)
    }
    run()
    return () => { cancelled = true }
  }, [ticker, range, compares])

  // Zoom resets whenever the underlying window changes.
  useEffect(() => { setZoom(null); setDragSel(null) }, [range, ticker, compares.length])

  const primary: ChartDataPoint[] = seriesCache.get(cacheKey(ticker, range)) || (range === '1Y' ? data : [])

  const series: SeriesInfo[] = useMemo(() => ([
    { key: 'v0', symbol: ticker, color: INK },
    ...compares.map((c, i) => ({ key: `v${i + 1}`, symbol: c, color: COMPARE_COLORS[i % COMPARE_COLORS.length] })),
  ]), [ticker, compares])

  // Merge all series onto the primary date axis.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const merged = useMemo(() => {
    if (!primary.length) return []
    const compMaps = compares.map(c => {
      const arr = seriesCache.get(cacheKey(c, range)) || []
      const m = new Map<string, number>()
      for (const p of arr) m.set(p.date, p.close ?? p.price)
      return m
    })
    return primary.map(p => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row: any = { ...p, v0: p.close ?? p.price }
      compares.forEach((c, i) => { row[`v${i + 1}`] = compMaps[i].get(p.date) ?? null })
      return row
    })
  }, [primary, compares, range, bump])

  // Percentage mode: normalize every series from its first value in the range.
  const plotted = useMemo(() => {
    const rows = zoom ? merged.slice(zoom.start, zoom.end + 1) : merged
    if (mode === '$') return rows
    const bases: Record<string, number> = {}
    for (const s of series) {
      const first = merged.find(r => r[s.key] != null)
      if (first) bases[s.key] = first[s.key]
    }
    return rows.map(r => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const out: any = { ...r }
      for (const s of series) {
        out[s.key] = r[s.key] != null && bases[s.key] ? ((r[s.key] / bases[s.key]) - 1) * 100 : null
      }
      return out
    })
  }, [merged, zoom, mode, series])

  const candleData = useMemo(
    () => plotted.map(d => ({ ...d, range: [d.low ?? d.price, d.high ?? d.price] as [number, number] })),
    [plotted],
  )

  const showCandle = view === 'Candle' && compares.length === 0 && mode === '$'
  const showOverlays = compares.length === 0 && mode === '$' && !isIntraday(range)

  const domain = useMemo<[number | string, number | string]>(() => {
    const vals: number[] = []
    for (const d of plotted) {
      for (const s of series) if (d[s.key] != null) vals.push(d[s.key])
      if (showCandle && d.low != null && d.high != null) { vals.push(d.low, d.high) }
      if (showOverlays && ov.ma50 && d.ma50 != null) vals.push(d.ma50)
      if (showOverlays && ov.ma200 && d.ma200 != null) vals.push(d.ma200)
    }
    if (showOverlays && ov.hi52 && hi52) vals.push(hi52)
    if (!vals.length) return ['auto', 'auto']
    const min = Math.min(...vals), max = Math.max(...vals)
    const pad = (max - min) * 0.06 || 1
    return [min - pad, max + pad]
  }, [plotted, series, ov, hi52, showCandle, showOverlays])

  // Delta readout always reflects the full selected range of the primary.
  const delta = useMemo(() => {
    const vals = merged.map(r => r.v0).filter((v: number | null) => v != null) as number[]
    if (vals.length < 2) return null
    const first = vals[0], last = vals[vals.length - 1]
    const abs = last - first
    const pct = first !== 0 ? (abs / first) * 100 : 0
    const sign = abs >= 0 ? '+' : '-'
    const sym = currencySymbol(currency)
    return {
      text: `${sign}${sym}${Math.abs(abs).toFixed(2)} (${sign}${Math.abs(pct).toFixed(2)}%) ${RANGE_LABEL[range] || range}`,
      color: abs >= 0 ? POS : NEG,
      last,
    }
  }, [merged, range, currency])

  // ---- zoom interactions: drag to select, nudge to pan, reset to clear ----
  const toAbsolute = useCallback((idx: number) => (zoom ? zoom.start + idx : idx), [zoom])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDown = (e: any) => {
    if (e && typeof e.activeTooltipIndex === 'number') {
      dragRef.current = toAbsolute(e.activeTooltipIndex)
      setDragSel(null)
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onMove = (e: any) => {
    if (dragRef.current != null && e && typeof e.activeTooltipIndex === 'number') {
      setDragSel({ from: dragRef.current, to: toAbsolute(e.activeTooltipIndex) })
    }
  }
  const onUp = () => {
    if (dragRef.current != null && dragSel) {
      const a = Math.min(dragSel.from, dragSel.to)
      const b = Math.max(dragSel.from, dragSel.to)
      if (b - a >= 3) setZoom({ start: a, end: b })
    }
    dragRef.current = null
    setDragSel(null)
  }
  const pan = (dir: -1 | 1) => {
    if (!zoom) return
    const span = zoom.end - zoom.start
    const step = Math.max(1, Math.round(span * 0.3)) * dir
    let start = zoom.start + step
    let end = zoom.end + step
    if (start < 0) { start = 0; end = span }
    if (end > merged.length - 1) { end = merged.length - 1; start = end - span }
    setZoom({ start, end })
  }
  // Wheel zoom only in fullscreen, where the page cannot scroll anyway.
  const onWheel = (e: React.WheelEvent) => {
    if (!fullscreen || merged.length < 8) return
    const cur = zoom || { start: 0, end: merged.length - 1 }
    const span = cur.end - cur.start
    const delta2 = Math.max(1, Math.round(span * 0.12)) * (e.deltaY > 0 ? 1 : -1)
    let start = cur.start - delta2
    let end = cur.end + delta2
    if (start < 0) start = 0
    if (end > merged.length - 1) end = merged.length - 1
    if (end - start < 5) return
    if (start === 0 && end === merged.length - 1) setZoom(null)
    else setZoom({ start, end })
  }

  useEffect(() => {
    if (!fullscreen) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false) }
    const sizeFs = () => setFsH(Math.max(320, window.innerHeight - 330))
    sizeFs()
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', sizeFs)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', sizeFs)
    }
  }, [fullscreen])

  // Compare autocomplete: same company-name search the main command bar uses.
  useEffect(() => {
    const q = compareInput.trim()
    if (q.length < 2) { setCompareSugs([]); setCompareOpen(false); return }
    let cancelled = false
    const t = setTimeout(async () => {
      const res = await searchSymbols(q)
      if (!cancelled) {
        const filtered = res.filter(r => r.symbol !== ticker && !compares.includes(r.symbol)).slice(0, 5)
        setCompareSugs(filtered)
        setCompareOpen(filtered.length > 0)
      }
    }, 220)
    return () => { cancelled = true; clearTimeout(t) }
  }, [compareInput, ticker, compares])

  const addCompare = (explicit?: string) => {
    const sym = (explicit || compareInput).trim().toUpperCase()
    setCompareError(null)
    setCompareOpen(false)
    if (!sym) return
    if (sym === ticker) { setCompareError('That is already the primary ticker.'); return }
    if (compares.includes(sym)) { setCompareError(`${sym} is already on the chart.`); return }
    if (compares.length >= MAX_COMPARES) { setCompareError(`Up to ${MAX_COMPARES} comparison tickers.`); return }
    setCompares(prev => [...prev, sym])
    setCompareInput('')
    setCompareSugs([])
    if (mode === '$') setMode('%')
    if (view === 'Candle') setView('Line')
  }
  const removeCompare = (sym: string) => {
    setCompares(prev => {
      const next = prev.filter(c => c !== sym)
      if (next.length === 0 && mode === '%') setMode('$')
      return next
    })
    setCompareError(null)
  }

  const candle = useMemo(() => detectCandlePattern(data), [data])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CrosshairTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = payload[0]?.payload || {}
    const sym = currencySymbol(currency)
    return (
      <div className="rounded-lg px-3 py-2.5 text-xs" style={{ background: 'rgba(14,16,20,0.96)', border: '1px solid var(--border-3)', color: INK, boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}>
        <p className="mb-1.5" style={{ color: MUTED }}>{fmtTooltipDate(label, range)}</p>
        {showCandle && row.open != null ? (
          <div className="space-y-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
            <p>O <span style={{ color: INK }}>{Number(row.open).toFixed(2)}</span></p>
            <p>H <span style={{ color: INK }}>{Number(row.high).toFixed(2)}</span></p>
            <p>L <span style={{ color: INK }}>{Number(row.low).toFixed(2)}</span></p>
            <p>C <span style={{ color: INK }}>{Number(row.close).toFixed(2)}</span></p>
          </div>
        ) : (
          <div className="space-y-1">
            {series.map(s => row[s.key] != null && (
              <p key={s.key} className="flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: 'inline-block' }} />
                <span style={{ color: MUTED }}>{s.symbol}</span>
                <span style={{ color: INK }}>
                  {mode === '%'
                    ? `${row[s.key] >= 0 ? '+' : ''}${Number(row[s.key]).toFixed(2)}%`
                    : `${sym}${Number(row[s.key]).toFixed(2)}`}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>
    )
  }

  const Segmented = <T extends string>({ options, value, onChange, disabled }: { options: T[]; value: T; onChange: (v: T) => void; disabled?: T[] }) => (
    <div className="inline-flex p-0.5 rounded-lg" style={{ background: 'rgba(236,231,223,0.06)' }}>
      {options.map(opt => {
        const active = opt === value
        const isDisabled = disabled?.includes(opt)
        return (
          <button
            key={opt}
            onClick={() => !isDisabled && onChange(opt)}
            className="px-2.5 py-1.5 rounded-md text-xs transition-all"
            style={{
              background: active ? 'rgba(236,231,223,0.92)' : 'transparent',
              color: active ? '#16160F' : isDisabled ? 'var(--faint)' : MUTED,
              fontFamily: 'var(--font-mono)',
              fontWeight: active ? 600 : 500,
              cursor: isDisabled ? 'default' : 'pointer',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )

  const chartBody = (height: number) => {
    if (failedRange && !primary.length) {
      return (
        <div className="flex flex-col items-center justify-center gap-2" style={{ height }}>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>No chart data for this range.</p>
          <p className="text-xs" style={{ color: MUTED }}>Some tickers do not provide intraday or long history. Try another range.</p>
        </div>
      )
    }
    if (loading && !plotted.length) {
      return (
        <div className="flex items-center justify-center gap-3" style={{ height }}>
          <span className="rr-scroll-pulse" style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--accent)', display: 'inline-block' }} />
          <span className="text-xs" style={{ color: MUTED, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>Loading {range} data</span>
        </div>
      )
    }
    if (!plotted.length) {
      return (
        <div className="flex items-center justify-center" style={{ height }}>
          <p className="text-sm" style={{ color: MUTED }}>No chart data available.</p>
        </div>
      )
    }
    return (
      <div onWheel={onWheel}>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart
            data={showCandle ? candleData : plotted}
            margin={{ top: 8, right: 30, bottom: 6, left: 4 }}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onDoubleClick={() => setZoom(null)}
          >
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => fmtAxis(d, range)}
              tick={{ fill: MUTED, fontSize: 10.5, fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'rgba(236,231,223,0.12)' }}
              tickLine={false}
              minTickGap={64}
            />
            <YAxis
              domain={domain as [number, number]}
              tickFormatter={(v: number) => (mode === '%' ? `${v >= 0 ? '+' : ''}${v.toFixed(0)}%` : `${currencySymbol(currency)}${Math.round(v)}`)}
              tick={{ fill: MUTED, fontSize: 10.5, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              orientation="right"
              width={62}
            />
            <Tooltip content={<CrosshairTooltip />} cursor={{ stroke: 'rgba(236,231,223,0.25)', strokeWidth: 1 }} />
            {mode === '%' && <ReferenceLine y={0} stroke="rgba(236,231,223,0.18)" strokeDasharray="3 4" />}
            {showOverlays && ov.hi52 && hi52 && (
              <ReferenceLine y={hi52} stroke={NEG} strokeDasharray="3 4" strokeWidth={0.9}
                label={{ value: `52W Hi ${currencySymbol(currency)}${hi52.toFixed(0)}`, position: 'right', fill: NEG, fontSize: 10, fontFamily: 'var(--font-mono)' }} />
            )}
            {dragSel && plotted.length > 0 && (
              <ReferenceArea
                x1={merged[Math.min(dragSel.from, dragSel.to)]?.date}
                x2={merged[Math.max(dragSel.from, dragSel.to)]?.date}
                fill="rgba(201,162,76,0.10)"
                stroke="rgba(201,162,76,0.35)"
              />
            )}
            {showCandle
              ? <Bar dataKey="range" shape={<Candle />} isAnimationActive={false} />
              : series.map(s => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.symbol}
                    stroke={s.color}
                    strokeWidth={s.key === 'v0' ? 1.9 : 1.4}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                ))}
            {showOverlays && !showCandle && ov.ma50 && <Line type="monotone" dataKey="ma50" stroke={GOLD} strokeWidth={1.1} strokeDasharray="5 3" dot={false} connectNulls isAnimationActive={false} />}
            {showOverlays && !showCandle && ov.ma200 && <Line type="monotone" dataKey="ma200" stroke={POS} strokeWidth={1.1} strokeDasharray="2 4" dot={false} connectNulls isAnimationActive={false} />}
            {showCandle && showOverlays && ov.ma50 && <Line type="monotone" dataKey="ma50" stroke={GOLD} strokeWidth={1.1} strokeDasharray="5 3" dot={false} connectNulls isAnimationActive={false} />}
            {showCandle && showOverlays && ov.ma200 && <Line type="monotone" dataKey="ma200" stroke={POS} strokeWidth={1.1} strokeDasharray="2 4" dot={false} connectNulls isAnimationActive={false} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const controls = (
    <>
      {/* Header: price + animated delta + actions */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <div className="flex items-baseline gap-3 flex-wrap">
            {delta && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.45rem', fontWeight: 600, color: INK, letterSpacing: '-0.02em' }}>
                {mode === '%' && compares.length > 0 ? ticker : `${currencySymbol(currency)}${delta.last.toFixed(2)}`}
              </span>
            )}
            {delta && <AnimatedDelta text={delta.text} color={delta.color} reduced={reduced} />}
          </div>
          <p className="text-[0.65rem] mt-1" style={{ color: 'var(--faint)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Market Monitor · {ticker}{compares.length > 0 ? ` vs ${compares.join(', ')}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {zoom && (
            <>
              <button onClick={() => pan(-1)} aria-label="Pan left" className="px-2 py-1.5 rounded-md text-xs" style={{ background: 'rgba(236,231,223,0.06)', color: MUTED }}>‹</button>
              <button onClick={() => pan(1)} aria-label="Pan right" className="px-2 py-1.5 rounded-md text-xs" style={{ background: 'rgba(236,231,223,0.06)', color: MUTED }}>›</button>
              <button onClick={() => setZoom(null)} className="px-2.5 py-1.5 rounded-md text-xs" style={{ background: 'rgba(201,162,76,0.12)', color: 'var(--accent-2)' }}>
                Reset zoom
              </button>
            </>
          )}
          <Segmented options={['$', '%']} value={mode} onChange={m => { setMode(m as '$' | '%'); if (m === '%' && view === 'Candle') setView('Line') }} />
          <Segmented
            options={['Line', 'Candle']}
            value={view}
            onChange={v => setView(v as 'Line' | 'Candle')}
            disabled={compares.length > 0 || mode === '%' ? ['Candle'] : undefined}
          />
          <button
            onClick={() => setFullscreen(f => !f)}
            className="px-2.5 py-1.5 rounded-md text-xs transition-all"
            style={{ background: 'rgba(236,231,223,0.06)', color: MUTED }}
            onMouseEnter={e => (e.currentTarget.style.color = INK)}
            onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
          >
            {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {/* Range row */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <Segmented options={RANGES} value={range} onChange={r => setRange(r)} />
        {loading && plotted.length > 0 && (
          <span className="text-xs" style={{ color: MUTED, fontFamily: 'var(--font-mono)' }}>updating…</span>
        )}
      </div>
    </>
  )

  const legendAndCompare = (
    <div className="flex items-center gap-2 flex-wrap mt-3">
      {/* Legend chips */}
      {series.map(s => (
        <span key={s.symbol} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs" style={{ background: 'rgba(236,231,223,0.05)', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
          <span style={{ width: 10, height: 3, borderRadius: 2, background: s.color, display: 'inline-block' }} />
          {s.symbol}
          {s.symbol !== ticker && (
            <button onClick={() => removeCompare(s.symbol)} aria-label={`Remove ${s.symbol}`} className="ml-0.5" style={{ color: MUTED }}>
              ✕
            </button>
          )}
        </span>
      ))}
      {showOverlays && !showCandle && (
        <>
          <button onClick={() => setOv(s => ({ ...s, ma50: !s.ma50 }))} className="text-[0.68rem] px-2 py-1 rounded-md" style={{ color: ov.ma50 ? GOLD : 'var(--faint)', background: 'rgba(236,231,223,0.04)' }}>50D MA</button>
          <button onClick={() => setOv(s => ({ ...s, ma200: !s.ma200 }))} className="text-[0.68rem] px-2 py-1 rounded-md" style={{ color: ov.ma200 ? POS : 'var(--faint)', background: 'rgba(236,231,223,0.04)' }}>200D MA</button>
          <button onClick={() => setOv(s => ({ ...s, hi52: !s.hi52 }))} className="text-[0.68rem] px-2 py-1 rounded-md" style={{ color: ov.hi52 ? NEG : 'var(--faint)', background: 'rgba(236,231,223,0.04)' }}>52W High</button>
        </>
      )}
      {/* Compare input with company-name autocomplete */}
      <div className="relative inline-flex items-center gap-1.5 ml-auto">
        <input
          value={compareInput}
          onChange={e => { setCompareInput(e.target.value.toUpperCase()); setCompareError(null) }}
          onKeyDown={e => { if (e.key === 'Enter') addCompare(); if (e.key === 'Escape') setCompareOpen(false) }}
          onBlur={() => setTimeout(() => setCompareOpen(false), 150)}
          onFocus={() => { if (compareSugs.length) setCompareOpen(true) }}
          placeholder="Compare: MSFT"
          spellCheck={false}
          className="px-2.5 py-1.5 rounded-md text-xs outline-none w-36"
          style={{ background: 'rgba(236,231,223,0.06)', color: INK, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
        />
        <button
          onClick={() => addCompare()}
          disabled={!compareInput.trim()}
          className="px-2.5 py-1.5 rounded-md text-xs font-semibold"
          style={{ background: 'rgba(201,162,76,0.12)', color: 'var(--accent-2)', opacity: compareInput.trim() ? 1 : 0.5 }}
        >
          Add
        </button>
        {compareOpen && compareSugs.length > 0 && (
          <div
            className="absolute right-0 overflow-hidden"
            style={{
              top: 'calc(100% + 6px)', zIndex: 60, minWidth: 230,
              background: 'rgba(16,18,22,0.98)', border: '1px solid var(--border-3)',
              borderRadius: 10, boxShadow: '0 18px 44px rgba(0,0,0,0.6)',
            }}
          >
            {compareSugs.map(s => (
              <button
                key={s.symbol}
                type="button"
                onMouseDown={e => { e.preventDefault(); addCompare(s.symbol) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                style={{ background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(236,231,223,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span className="flex-1 truncate text-xs" style={{ color: INK }}>{s.name}</span>
                <span className="text-[0.68rem]" style={{ fontFamily: 'var(--font-mono)', color: MUTED }}>{s.symbol}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {compareError && (
        <p className="w-full text-xs mt-1" style={{ color: 'var(--caut)' }}>{compareError}</p>
      )}
    </div>
  )

  const hintLine = (
    <p className="text-[0.68rem] mt-2.5" style={{ color: 'var(--faint)' }}>
      Drag across the chart to zoom. Double click to reset.{fullscreen ? ' Scroll to zoom. Esc to exit.' : ''}
    </p>
  )

  const panel = (height: number) => (
    <div
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(24,27,34,0.94) 0%, rgba(13,15,19,0.97) 100%)',
        border: '1px solid var(--border-2)',
        borderRadius: 18,
        boxShadow: '0 30px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(236,231,223,0.05)',
        padding: 'clamp(1.1rem, 2.4vw, 1.6rem)',
      }}
    >
      {/* soft instrument glow */}
      <div aria-hidden style={{ position: 'absolute', top: -140, left: '30%', width: 420, height: 280, background: 'radial-gradient(ellipse, rgba(201,162,76,0.07), transparent 70%)', pointerEvents: 'none' }} />
      {controls}
      {chartBody(height)}
      {legendAndCompare}
      {hintLine}
    </div>
  )

  return (
    <>
      {/* The inline panel stays mounted while fullscreen is open, so closing
          never causes a layout jump or scroll reset. */}
      {panel(330)}

      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[80] overflow-y-auto px-4 md:px-10 py-6"
            style={{ background: 'rgba(5,6,8,0.97)' }}
          >
            <div className="max-w-6xl w-full mx-auto flex flex-col min-h-full justify-center">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs tracking-[0.16em] uppercase" style={{ color: MUTED }}>
                  {ticker} · Fullscreen chart
                </p>
                <button
                  onClick={() => setFullscreen(false)}
                  aria-label="Close fullscreen chart"
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{ background: 'rgba(236,231,223,0.08)', color: INK }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(236,231,223,0.14)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(236,231,223,0.08)')}
                >
                  ✕ Close
                </button>
              </div>
              {panel(fsH)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Candlestick Pattern Read: stays under the cockpit chart, same shell */}
      <div
        className="mt-5 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(26,29,36,0.9) 0%, rgba(15,17,21,0.95) 100%)',
          border: '1px solid var(--border-2)',
          borderRadius: 16,
          boxShadow: '0 18px 44px rgba(0,0,0,0.4), inset 0 1px 0 rgba(236,231,223,0.04)',
          color: INK,
        }}
      >
        <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: '1px solid var(--border-2)' }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)' }}>
            Candlestick Pattern Read
          </span>
          <span className="text-xs px-3 py-1 rounded-full ml-auto inline-flex items-center gap-1.5"
            style={{ background: 'rgba(236,231,223,0.06)', color: candle.bias === 'bullish' ? POS : NEG, fontWeight: 700, letterSpacing: '0.03em' }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: candle.bias === 'bullish' ? POS : NEG, display: 'inline-block' }} />
            Short-term {candle.bias} bias
          </span>
        </div>
        <div className="px-5 py-4 space-y-2.5">
          <div className="flex flex-wrap gap-x-7 gap-y-1.5">
            <span className="text-sm" style={{ color: 'var(--text-2)' }}>
              Pattern / structure: <span style={{ color: INK, fontWeight: 600 }}>{candle.pattern}</span>
            </span>
            <span className="text-sm" style={{ color: 'var(--text-2)' }}>
              Confidence: <span style={{ color: INK, fontWeight: 600 }}>{candle.confidence}</span>
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
            <span style={{ color: MUTED }}>Reason. </span>{candle.why}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
            <span style={{ color: MUTED }}>Context. </span>{candle.context}
          </p>
          {chartRead.summary && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)', borderLeft: '2px solid var(--accent)', paddingLeft: '0.9rem' }}>
              {cleanText(chartRead.summary)}
            </p>
          )}
          <p className="text-xs leading-relaxed pt-1" style={{ color: MUTED }}>
            Technical signals are educational pattern readings, not predictions.
          </p>
        </div>
      </div>
    </>
  )
}
