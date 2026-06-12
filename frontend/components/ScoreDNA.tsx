'use client'
import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { RatingResponse } from '@/lib/types'
import { TooltipTerm } from '@/components/TooltipTerm'
import { TOOLTIPS } from '@/lib/tooltips'
import { cleanText } from '@/lib/utils'

// Score DNA: where the points came from. Lives inside the cockpit's left
// column under the chart, in the same graphite shell as every other cockpit
// card. Hover previews a category; click pins it. This card IS the score
// breakdown, so no separate breakdown section exists below it.

// Brightened for the dark shell; still muted, never rainbow.
const CATEGORY_INK: Record<string, string> = {
  valuation: '#C9A24C',
  analyst: '#7C93AC',
  profitability: '#2E9466',
  cashflow: '#5FA8A0',
  technical: '#C96A4C',
  confidence: '#8E8B7E',
}

const INK = 'var(--text)'
const SUB = 'var(--text-2)'
const MUTED = 'var(--muted)'

function signalInk(signal: string): string {
  const s = signal.toLowerCase()
  if (s === 'strong' || s === 'solid') return 'var(--pos)'
  if (s === 'mixed' || s === 'pressured') return 'var(--caut)'
  return 'var(--neg)'
}

export function ScoreDNA({ data }: { data: RatingResponse }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [pinned, setPinned] = useState<number | null>(null)
  const reduced = useReducedMotion()

  const slices = useMemo(
    () =>
      (data.categoryScores || [])
        .filter(c => c && c.score > 0)
        .map(c => ({
          key: c.key,
          name: c.name,
          value: c.score,
          max: c.maxScore,
          signal: c.signal,
          reason: c.reason,
          color: CATEGORY_INK[c.key] || '#8E8B7E',
        })),
    [data.categoryScores],
  )

  if (slices.length === 0) return null

  const active = hovered ?? pinned
  const activeSlice = active != null ? slices[active] : null

  return (
    <div
      className="mt-5 overflow-hidden rr-lift"
      style={{
        background: 'linear-gradient(180deg, rgba(26,29,36,0.9) 0%, rgba(15,17,21,0.95) 100%)',
        border: '1px solid var(--border-2)',
        borderRadius: 16,
        boxShadow: '0 18px 44px rgba(0,0,0,0.4), inset 0 1px 0 rgba(236,231,223,0.04)',
        padding: 'clamp(1.1rem, 2.4vw, 1.5rem)',
        color: INK,
      }}
    >
      <p className="text-[0.62rem] tracking-[0.18em] uppercase mb-2" style={{ color: 'var(--accent)', fontWeight: 600 }}>
        <TooltipTerm term="Score DNA">Score DNA</TooltipTerm>
      </p>
      <p className="mb-5 text-xs leading-relaxed" style={{ color: SUB, maxWidth: 560 }}>
        Where the {data.overallScore} points came from. Each slice is the points a category
        actually earned. Hover to preview, click to pin a category.
      </p>

      <div className="grid sm:grid-cols-[230px_1fr] grid-cols-1 gap-6 items-center">
        {/* Donut */}
        <div className="relative mx-auto w-full" style={{ maxWidth: 230, height: 210 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="68%"
                outerRadius="96%"
                paddingAngle={2}
                stroke="none"
                isAnimationActive={false}
                onMouseLeave={() => setHovered(null)}
              >
                {slices.map((s, i) => (
                  <Cell
                    key={s.key}
                    fill={s.color}
                    opacity={active == null || active === i ? 0.92 : 0.3}
                    style={{ cursor: 'pointer', transition: 'opacity 0.25s ease', outline: 'none' }}
                    onMouseEnter={() => setHovered(i)}
                    onClick={() => setPinned(p => (p === i ? null : i))}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center readout: the score locks into the middle of the donut */}
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
            whileInView={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2.1rem', fontWeight: 600, color: INK, lineHeight: 1 }}>
              {data.overallScore}
            </span>
            <span style={{ fontSize: '0.64rem', color: MUTED, letterSpacing: '0.12em', marginTop: 4 }}>
              / 100 EARNED
            </span>
          </motion.div>
        </div>

        {/* Legend + live read */}
        <div>
          <div className="space-y-0.5">
            {slices.map((s, i) => {
              const isActive = active === i
              return (
                <button
                  key={s.key}
                  type="button"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setPinned(p => (p === i ? null : i))}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-colors"
                  style={{
                    background: isActive ? 'rgba(236,231,223,0.06)' : 'transparent',
                    outline: pinned === i ? '1px solid rgba(201,162,76,0.35)' : 'none',
                  }}
                >
                  <span className="shrink-0" style={{ width: 9, height: 9, borderRadius: 3, background: s.color, display: 'inline-block' }} />
                  <span className="flex-1" style={{ fontSize: '0.82rem', fontWeight: 500, color: INK }}>
                    {s.name}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: signalInk(s.signal), fontWeight: 600 }}>
                    {s.signal}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: INK, minWidth: 52, textAlign: 'right' }}>
                    {s.value}<span style={{ color: MUTED }}> / {s.max}</span>
                  </span>
                </button>
              )
            })}
          </div>

          {/* Active slice explanation, beginner-friendly */}
          <div
            className="mt-3 px-3.5 py-3 rounded-xl"
            style={{ background: 'rgba(236,231,223,0.04)', border: '1px solid var(--border-2)', minHeight: 78 }}
          >
            {activeSlice ? (
              <>
                <p style={{ fontSize: '0.76rem', fontWeight: 600, color: INK, marginBottom: 4 }}>
                  {activeSlice.name}: {activeSlice.value} / {activeSlice.max}
                </p>
                <p style={{ fontSize: '0.76rem', lineHeight: 1.6, color: SUB }}>
                  {activeSlice.reason
                    ? cleanText(activeSlice.reason)
                    : TOOLTIPS[activeSlice.name] || 'This category contributed the points shown to the overall score.'}
                </p>
              </>
            ) : (
              <p style={{ fontSize: '0.76rem', lineHeight: 1.6, color: MUTED }}>
                The donut always sums to the overall score, so nothing here is hidden weighting.
                Hover a slice for the read on each category.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
