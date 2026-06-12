'use client'
import { useMemo, useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { RatingResponse } from '@/lib/types'
import { formatPrice, formatMarketCap, cleanText } from '@/lib/utils'
import { AnimatedScore } from '@/components/AnimatedScore'
import { TooltipTerm } from '@/components/TooltipTerm'
import { detectCandlePattern } from '@/lib/candlePatterns'
import { useWatchlist } from '@/lib/watchlist'

function takeawayMeta(type: string) {
  if (type === 'positive') return { mark: '+', color: 'var(--pos)', label: 'Best argument' }
  if (type === 'negative') return { mark: '–', color: 'var(--neg)', label: 'Main concern' }
  return { mark: '/', color: 'var(--caut)', label: 'Technical read' }
}

function scoreGlow(score: number): string {
  if (score >= 70) return 'rgba(46,148,102,0.10)'
  if (score >= 55) return 'rgba(192,154,62,0.10)'
  return 'rgba(178,58,58,0.10)'
}

function biasInk(direction: string): string {
  return direction.toLowerCase().includes('bull') ? 'var(--pos)' : 'var(--neg)'
}

// Fallback long-term read when the backend predates longTermThesisBias.
function fallbackBias(score: number): { label: string; direction: string; reason: string; confidence: string } {
  if (score >= 70) return { label: 'Bullish', direction: 'Bullish', reason: 'The overall score supports the long-term case.', confidence: 'Medium' }
  if (score >= 58) return { label: 'Cautiously bullish', direction: 'Bullish', reason: 'The evidence leans positive, with reservations.', confidence: 'Medium' }
  if (score >= 45) return { label: 'Cautiously bearish', direction: 'Bearish', reason: 'The weaker pillars currently outweigh the supports.', confidence: 'Medium' }
  return { label: 'Bearish', direction: 'Bearish', reason: 'A weak overall score undercuts the long-term case.', confidence: 'Medium' }
}

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1) }

// Dossier assembly: identity slides in, score locks, the verdict lands last.
const col = (delay: number, reduced: boolean) => ({
  initial: reduced ? { opacity: 0 } : { opacity: 0, y: 22 },
  animate: reduced ? { opacity: 1 } : { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
})

export function ScoreHero({ data }: { data: RatingResponse }) {
  const reduced = useReducedMotion() ?? false
  const meta = [data.ticker, data.sector, data.industry].filter(Boolean)
  const takeaways = data.takeaways.slice(0, 3)
  const longTerm = data.longTermThesisBias ?? fallbackBias(data.overallScore)
  const candle = useMemo(() => detectCandlePattern(data.chartData), [data.chartData])
  const coldTake = cleanText(data.nuancedLabel || data.oneLineVerdict)

  // Watchlist: the shared hook keeps this button in sync with the drawer and
  // Discover, including removals made elsewhere while this report is open.
  const { has, save, remove } = useWatchlist()
  const saved = has(data.ticker)
  const [justSaved, setJustSaved] = useState(false)
  useEffect(() => {
    if (!justSaved) return
    const t = setTimeout(() => setJustSaved(false), 2200)
    return () => clearTimeout(t)
  }, [justSaved])

  const toggleSave = () => {
    if (saved) {
      remove(data.ticker)
      setJustSaved(false)
    } else {
      save({
        symbol: data.ticker,
        name: data.companyName || data.ticker,
        score: data.overallScore,
        bias: longTerm.label,
      })
      setJustSaved(true)
    }
  }

  return (
    <div style={{ perspective: 1200 }}>
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 42, rotateX: 6 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-8 overflow-hidden"
        style={{
          borderRadius: 20,
          background: 'linear-gradient(180deg, var(--elevated) 0%, var(--surface) 100%)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* score-tinted ambient glow */}
        <div
          style={{
            position: 'absolute',
            top: -120, right: -80,
            width: 460, height: 460,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${scoreGlow(data.overallScore)} 0%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />
        {/* one-time light sweep across the dossier cover */}
        {!reduced && <div aria-hidden className="rr-sweep" />}

        <div className="relative p-8">
          <div className="grid gap-8 md:grid-cols-[1.05fr_1.15fr_auto] grid-cols-1">
            {/* Identity */}
            <motion.div {...col(0.1, reduced)} className="flex flex-col gap-5">
              <div>
                <h2
                  className="font-semibold leading-tight mb-1.5"
                  style={{ color: 'var(--text)', fontSize: '1.75rem', letterSpacing: '-0.025em' }}
                >
                  {data.companyName}
                </h2>
                <p className="text-xs" style={{ color: 'var(--muted)', letterSpacing: '0.05em' }}>
                  {meta.join('  ·  ')}
                </p>
              </div>
              <div>
                <p
                  style={{
                    color: 'var(--text)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '2rem',
                    fontWeight: 500,
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >
                  {formatPrice(data.currentPrice, data.currency)}
                </p>
                <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
                  Market cap <span className="num" style={{ color: 'var(--text-2)' }}>{formatMarketCap(data.marketCap, data.currency)}</span>
                </p>
              </div>

              {/* Watchlist control */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={toggleSave}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: saved ? 'var(--surface-2)' : 'var(--accent-bg)',
                    color: saved ? 'var(--text-2)' : 'var(--accent-2)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = saved ? 'var(--surface-3)' : 'rgba(201,162,76,0.16)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = saved ? 'var(--surface-2)' : 'var(--accent-bg)' }}
                >
                  <span
                    style={{
                      width: 6, height: 6, borderRadius: 999, display: 'inline-block',
                      background: saved ? 'var(--pos)' : 'var(--accent)',
                    }}
                  />
                  {saved ? 'Saved' : 'Add to watchlist'}
                </button>
                {justSaved && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs"
                    style={{ color: 'var(--pos)' }}
                  >
                    Saved to watchlist
                  </motion.span>
                )}
              </div>
            </motion.div>

            {/* Cold take + takeaways */}
            <motion.div {...col(0.26, reduced)} className="flex flex-col gap-5">
              <div>
                <p className="text-[0.6rem] tracking-[0.16em] uppercase mb-1" style={{ color: 'var(--accent)' }}>
                  Cold take
                </p>
                <p
                  className="leading-snug font-medium"
                  style={{ color: 'var(--text)', fontSize: '1.15rem', letterSpacing: '-0.015em' }}
                >
                  {coldTake}
                </p>
              </div>
              <div className="space-y-3">
                {takeaways.map((t, i) => {
                  const m = takeawayMeta(t.type)
                  return (
                    <div key={i} className="flex gap-3 items-start">
                      <span
                        className="shrink-0 flex items-center justify-center"
                        style={{
                          width: 18, height: 18, borderRadius: 5,
                          background: m.color, color: 'var(--bg)',
                          fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.7rem',
                          marginTop: 1,
                        }}
                      >
                        {m.mark}
                      </span>
                      <div>
                        <p className="text-[0.6rem] tracking-[0.14em] uppercase mb-0.5" style={{ color: 'var(--faint)' }}>
                          {m.label}
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                          {cleanText(t.text)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* Score artifact: locks in with a settle */}
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.75, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-center"
              style={{ minWidth: 200 }}
            >
              <AnimatedScore
                score={data.overallScore}
                label={data.ratingLabel}
                confidence={data.dataConfidence}
              />
            </motion.div>
          </div>

          {/* Decisive bias strip: the verdict lands last */}
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.985 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.62, ease: [0.22, 1, 0.36, 1] }}
            className="grid sm:grid-cols-2 grid-cols-1 gap-x-8 gap-y-4 mt-8 pt-6"
            style={{ borderTop: '1px solid var(--border-2)' }}
          >
            <div>
              <p className="text-[0.6rem] tracking-[0.16em] uppercase mb-1.5" style={{ color: 'var(--faint)' }}>
                <TooltipTerm term="Long-term thesis bias">Long-term thesis bias</TooltipTerm>
              </p>
              <p className="flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
                  style={{ color: biasInk(longTerm.direction), background: 'var(--surface-2)' }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: biasInk(longTerm.direction), display: 'inline-block' }} />
                  {longTerm.label}
                </span>
                <span className="text-[0.68rem]" style={{ color: 'var(--muted)' }}>
                  Confidence: {longTerm.confidence}
                </span>
              </p>
              {longTerm.reason && (
                <p className="text-xs leading-relaxed mt-2" style={{ color: 'var(--text-2)', maxWidth: 440 }}>
                  {cleanText(longTerm.reason)}
                </p>
              )}
            </div>

            <div>
              <p className="text-[0.6rem] tracking-[0.16em] uppercase mb-1.5" style={{ color: 'var(--faint)' }}>
                <TooltipTerm term="Short-term technical bias">Short-term technical bias</TooltipTerm>
              </p>
              <p className="flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
                  style={{ color: biasInk(candle.bias), background: 'var(--surface-2)' }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: biasInk(candle.bias), display: 'inline-block' }} />
                  {cap(candle.bias)}
                </span>
                <span className="text-[0.68rem]" style={{ color: 'var(--muted)' }}>
                  {candle.pattern}
                </span>
              </p>
              <p className="text-xs leading-relaxed mt-2" style={{ color: 'var(--text-2)', maxWidth: 440 }}>
                Educational pattern reading from recent candles, not a prediction.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
