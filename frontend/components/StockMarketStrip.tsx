'use client'
import { useMemo } from 'react'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { StockLogo } from '@/components/StockLogo'

// A flowing market tape for the landing page: clickable mini market cards
// (ticker badge, name, sparkline) drifting like a live strip. The sparklines
// are deterministic decorative previews seeded from the ticker, deliberately
// unlabeled with prices so nothing reads as live market data.

interface StripStock {
  symbol: string
  name: string
}

const STRIP_STOCKS: StripStock[] = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'AVGO', name: 'Broadcom' },
  { symbol: 'JPM', name: 'JPMorgan' },
  { symbol: 'COST', name: 'Costco' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'AMD', name: 'AMD' },
  { symbol: 'NFLX', name: 'Netflix' },
]

// Small deterministic PRNG so each ticker always draws the same sparkline.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashOf(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function Sparkline({ symbol }: { symbol: string }) {
  const { points, up } = useMemo(() => {
    const rand = mulberry32(hashOf(symbol))
    const trendUp = hashOf(symbol) % 3 !== 0 // most drift up, some down
    const n = 22
    let v = 11
    const pts: string[] = []
    for (let i = 0; i < n; i++) {
      v += (rand() - (trendUp ? 0.42 : 0.58)) * 3.4
      v = Math.max(2, Math.min(20, v))
      pts.push(`${(i / (n - 1)) * 68},${22 - v}`)
    }
    return { points: pts.join(' '), up: trendUp }
  }, [symbol])

  const color = up ? 'var(--pos)' : 'var(--neg)'
  return (
    <svg width="68" height="22" viewBox="0 0 68 22" aria-hidden>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.4" opacity="0.85" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function StockMarketStrip({ onSelect }: { onSelect: (symbol: string) => void }) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="h-px mb-3" style={{ background: 'var(--border-2)', maskImage: 'linear-gradient(to right, transparent, black, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black, transparent)' }} />
      <div
        className="overflow-hidden py-1"
        style={{ maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)' }}
      >
        <InfiniteSlider gap={14} duration={55} durationOnHover={160}>
          {STRIP_STOCKS.map(s => (
            <button
              key={s.symbol}
              onClick={() => onSelect(s.symbol)}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all shrink-0"
              style={{
                background: 'rgba(27,30,37,0.92)',
                border: '1px solid var(--border-2)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                boxShadow: '0 8px 22px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(38,42,51,0.96)'; e.currentTarget.style.borderColor = 'var(--border-3)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(27,30,37,0.92)'; e.currentTarget.style.borderColor = 'var(--border-2)' }}
              aria-label={`Run the score for ${s.name}`}
            >
              <StockLogo symbol={s.symbol} size={34} radius={9} />
              <span className="text-left">
                <span className="block text-xs font-medium" style={{ color: 'var(--text)' }}>{s.name}</span>
                <span className="block text-[0.62rem]" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>{s.symbol}</span>
              </span>
              <Sparkline symbol={s.symbol} />
            </button>
          ))}
        </InfiniteSlider>
      </div>
      <div className="h-px mt-3" style={{ background: 'var(--border-2)', maskImage: 'linear-gradient(to right, transparent, black, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black, transparent)' }} />
    </div>
  )
}
