'use client'
import { useState, useEffect, useMemo } from 'react'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { ChartDataPoint, ChartRead, ChartRange } from '@/lib/types'
import { fetchChart } from '@/lib/api'
import { detectCandlePattern, Bias } from '@/lib/candlePatterns'
import { cleanText } from '@/lib/utils'

interface PriceChartProps {
  ticker: string
  data: ChartDataPoint[]
  chartRead: ChartRead
  hi52?: number | null
}

const RANGES: ChartRange[] = ['1M', '3M', '6M', '1Y', '5Y']

// Ivory editorial palette
const PANEL = 'linear-gradient(168deg, #ECE6DA 0%, #E1DACB 120%)'
const INK = '#1A1A12'
const INK2 = '#46453A'
const INK_MUTED = '#7C7660'
const POS = '#2F7048'
const NEG = '#963232'
const GOLD = '#9A7B2E'
const GRIDLINE = 'rgba(26,26,18,0.10)'

function biasColor(b: Bias): string { return b === 'bullish' ? POS : NEG }
function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1) }

function Segmented<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex p-0.5 rounded-lg" style={{ background: 'rgba(26,26,18,0.07)' }}>
      {options.map(opt => {
        const active = opt === value
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className="px-3 py-1.5 rounded-md text-xs transition-all"
            style={{
              background: active ? INK : 'transparent',
              color: active ? '#ECE6DA' : INK_MUTED,
              fontFamily: 'var(--font-mono)',
              fontWeight: active ? 600 : 500,
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function OverlayToggle({ label, color, on, onClick }: { label: string; color: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all"
      style={{ background: on ? 'rgba(26,26,18,0.07)' : 'transparent', color: on ? INK2 : '#A39C88' }}
    >
      <span style={{ width: 14, height: 2, borderRadius: 2, background: on ? color : '#B8B0A0', display: 'inline-block' }} />
      {label}
    </button>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label, view }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload || {}
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#F4EFE6', color: INK, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
      <p className="mb-1.5 font-medium" style={{ color: INK_MUTED }}>{label}</p>
      {view === 'candle' && p.open != null ? (
        <div className="space-y-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
          <p>O <span style={{ color: INK2 }}>{Number(p.open).toFixed(2)}</span></p>
          <p>H <span style={{ color: INK2 }}>{Number(p.high).toFixed(2)}</span></p>
          <p>L <span style={{ color: INK2 }}>{Number(p.low).toFixed(2)}</span></p>
          <p>C <span style={{ color: INK2 }}>{Number(p.close).toFixed(2)}</span></p>
        </div>
      ) : (
        <p style={{ fontFamily: 'var(--font-mono)' }}>${Number(p.price).toFixed(2)}</p>
      )}
    </div>
  )
}

function formatXAxis(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export function PriceChart({ ticker, data, chartRead, hi52 }: PriceChartProps) {
  const [view, setView] = useState<'Line' | 'Candle'>('Line')
  const [range, setRange] = useState<ChartRange>('1Y')
  const [series, setSeries] = useState<ChartDataPoint[]>(data)
  const [chartLoading, setChartLoading] = useState(false)
  const [ov, setOv] = useState({ ma50: true, ma200: true, hi52: true })

  useEffect(() => {
    let cancelled = false
    if (range === '1Y') { setSeries(data); setChartLoading(false); return }
    setChartLoading(true)
    fetchChart(ticker, range)
      .then(r => { if (!cancelled) { setSeries(r.chartData); setChartLoading(false) } })
      .catch(() => { if (!cancelled) { setSeries(data); setChartLoading(false) } })
    return () => { cancelled = true }
  }, [range, ticker, data])

  const candleData = useMemo(
    () => series.map(d => ({ ...d, range: [d.low ?? d.price, d.high ?? d.price] as [number, number] })),
    [series],
  )

  const domain = useMemo<[number, number]>(() => {
    const vals: number[] = []
    for (const d of series) {
      if (view === 'Candle' && d.low != null && d.high != null) { vals.push(d.low, d.high) }
      else { vals.push(d.price) }
      if (ov.ma50 && d.ma50 != null) vals.push(d.ma50)
      if (ov.ma200 && d.ma200 != null) vals.push(d.ma200)
    }
    if (ov.hi52 && hi52) vals.push(hi52)
    if (!vals.length) return [0, 1]
    const min = Math.min(...vals), max = Math.max(...vals)
    const pad = (max - min) * 0.06 || 1
    return [min - pad, max + pad]
  }, [series, view, ov, hi52])

  const candle = useMemo(() => detectCandlePattern(series), [series])

  if (!data || data.length === 0) {
    return (
      <section className="mt-16">
        <p className="eyebrow mb-5" style={{ color: 'var(--accent)' }}>Price Chart</p>
        <p className="text-sm py-4" style={{ color: 'var(--muted)' }}>No chart data available.</p>
      </section>
    )
  }

  const chips = [
    { label: 'vs 52W High', value: chartRead.vs52WeekHigh },
    { label: 'vs 50D MA', value: chartRead.vs50DayMA },
    { label: 'vs 200D MA', value: chartRead.vs200DayMA },
  ]

  return (
    <section className="mt-16">
      <p className="eyebrow mb-5" style={{ color: 'var(--accent)' }}>Price Chart</p>

      {/* Light editorial chart panel */}
      <div style={{ background: PANEL, borderRadius: 18, boxShadow: '0 30px 70px rgba(0,0,0,0.5)', padding: 'clamp(1.5rem, 3vw, 2rem)', color: INK }}>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
          <div className="flex items-center gap-4">
            {[{ label: 'Price', c: INK }, { label: '50D MA', c: GOLD }, { label: '200D MA', c: POS }].map(l => (
              <span key={l.label} className="flex items-center gap-1.5 text-xs" style={{ color: INK_MUTED }}>
                <span style={{ width: 18, height: 2, borderRadius: 2, background: l.c }} />
                {l.label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Segmented options={['Line', 'Candle']} value={view} onChange={setView} />
            <Segmented options={RANGES} value={range} onChange={setRange} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <OverlayToggle label="50D MA" color={GOLD} on={ov.ma50} onClick={() => setOv(s => ({ ...s, ma50: !s.ma50 }))} />
          <OverlayToggle label="200D MA" color={POS} on={ov.ma200} onClick={() => setOv(s => ({ ...s, ma200: !s.ma200 }))} />
          <OverlayToggle label="52W High" color={NEG} on={ov.hi52} onClick={() => setOv(s => ({ ...s, hi52: !s.hi52 }))} />
          {chartLoading && <span className="text-xs ml-2" style={{ color: INK_MUTED, fontFamily: 'var(--font-mono)' }}>loading {range}...</span>}
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={candleData} margin={{ top: 8, right: 26, bottom: 8, left: 4 }}>
            <CartesianGrid stroke={GRIDLINE} vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fill: INK_MUTED, fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={{ stroke: 'rgba(26,26,18,0.2)' }} tickLine={false} minTickGap={70} />
            <YAxis domain={domain} tickFormatter={(v: number) => `$${Math.round(v)}`} tick={{ fill: INK_MUTED, fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} orientation="right" width={60} />
            <Tooltip content={<ChartTooltip view={view === 'Candle' ? 'candle' : 'line'} />} />
            {ov.hi52 && hi52 && (
              <ReferenceLine y={hi52} stroke={NEG} strokeDasharray="3 4" strokeWidth={0.9}
                label={{ value: `52W Hi  $${hi52.toFixed(0)}`, position: 'right', fill: NEG, fontSize: 10, fontFamily: 'var(--font-mono)' }} />
            )}
            {view === 'Candle'
              ? <Bar dataKey="range" shape={<Candle />} isAnimationActive={false} />
              : <Line type="monotone" dataKey="price" name="Price" stroke={INK} strokeWidth={1.8} dot={false} isAnimationActive={false} />}
            {ov.ma50 && <Line type="monotone" dataKey="ma50" name="50D MA" stroke={GOLD} strokeWidth={1.3} strokeDasharray="5 3" dot={false} connectNulls isAnimationActive={false} />}
            {ov.ma200 && <Line type="monotone" dataKey="ma200" name="200D MA" stroke={POS} strokeWidth={1.3} strokeDasharray="2 4" dot={false} connectNulls isAnimationActive={false} />}
          </ComposedChart>
        </ResponsiveContainer>

        {/* chart read chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {chips.map(chip => {
            const lower = chip.value.toLowerCase()
            const color = lower.includes('above') ? POS : lower.includes('below') ? NEG : INK_MUTED
            return (
              <span key={chip.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(26,26,18,0.06)' }}>
                <span style={{ color: INK_MUTED, fontSize: 10 }}>{chip.label}</span>
                <span style={{ color, fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>{chip.value}</span>
              </span>
            )
          })}
        </div>

        {chartRead.summary && (
          <p className="mt-4 text-sm leading-relaxed" style={{ color: INK2, borderLeft: `2px solid ${GOLD}`, paddingLeft: '1rem' }}>
            {cleanText(chartRead.summary)}
          </p>
        )}
      </div>

      {/* Candlestick Pattern Read: featured light panel, always directional */}
      <div className="mt-6 overflow-hidden" style={{ background: PANEL, borderRadius: 18, boxShadow: '0 24px 60px rgba(0,0,0,0.45)', color: INK }}>
        <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid rgba(26,26,18,0.10)' }}>
          <span style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: INK_MUTED }}>
            Candlestick Pattern Read
          </span>
          <span className="text-xs px-3 py-1 rounded-full ml-auto inline-flex items-center gap-1.5"
            style={{ background: biasColor(candle.bias) === POS ? 'rgba(47,112,72,0.14)' : 'rgba(150,50,50,0.14)', color: biasColor(candle.bias), fontWeight: 700, letterSpacing: '0.03em' }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: biasColor(candle.bias), display: 'inline-block' }} />
            Short-term {candle.bias} bias
          </span>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <span className="text-sm" style={{ color: INK2 }}>
              Short-term bias: <span style={{ color: biasColor(candle.bias), fontWeight: 700 }}>{cap(candle.bias)}</span>
            </span>
            <span className="text-sm" style={{ color: INK2 }}>
              Pattern / structure: <span style={{ color: INK, fontWeight: 600 }}>{candle.pattern}</span>
            </span>
            <span className="text-sm" style={{ color: INK2 }}>
              Confidence: <span style={{ color: INK, fontWeight: 600 }}>{candle.confidence}</span>
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: INK2 }}>
            <span style={{ color: INK_MUTED }}>Reason. </span>{candle.why}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: INK2 }}>
            <span style={{ color: INK_MUTED }}>Context. </span>{candle.context}
          </p>
          <p className="text-xs leading-relaxed pt-1" style={{ color: INK_MUTED }}>
            Technical signals are educational pattern readings, not predictions.
          </p>
        </div>
      </div>
    </section>
  )
}
