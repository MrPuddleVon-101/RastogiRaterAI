'use client'
import { RatingResponse } from '@/lib/types'
import { TooltipTerm } from '@/components/TooltipTerm'
import { cleanText } from '@/lib/utils'

// Muted, matte signal colors that read well as ink on an ivory surface.
function signalInk(signal: string): string {
  const s = signal.toLowerCase()
  if (s === 'strong' || s === 'solid') return '#2F7048'
  if (s === 'mixed' || s === 'pressured') return '#8A6A22'
  return '#963232'
}

const IVORY = 'linear-gradient(168deg, #ECE6DA 0%, #E1DACB 120%)'

export function ScoreAnatomy({ data }: { data: RatingResponse }) {
  return (
    <section className="mt-16" id="score-breakdown">
      <p className="eyebrow mb-5" style={{ color: 'var(--accent)' }}>Score Breakdown</p>

      <div
        className="overflow-hidden"
        style={{ background: IVORY, borderRadius: 18, boxShadow: '0 30px 70px rgba(0,0,0,0.5)', color: '#1A1A12' }}
      >
        {data.categoryScores.map((cat, i) => {
          const ink = signalInk(cat.signal)
          const pct = Math.round((cat.score / cat.maxScore) * 100)
          return (
            <div
              key={cat.key}
              id={`cat-${cat.key}`}
              style={{
                padding: '1.25rem clamp(1.25rem, 3vw, 2rem)',
                borderTop: i === 0 ? 'none' : '1px solid rgba(26,26,18,0.10)',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '0.5rem 1.5rem',
                alignItems: 'center',
              }}
            >
              {/* left: name + bar */}
              <div style={{ minWidth: 0 }}>
                <div className="flex items-center gap-3 mb-2">
                  <TooltipTerm term={cat.name}>
                    <span style={{ fontWeight: 600, fontSize: '1.02rem', color: '#1A1A12', letterSpacing: '-0.01em' }}>
                      {cat.name}
                    </span>
                  </TooltipTerm>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ color: ink, background: 'rgba(26,26,18,0.06)', fontWeight: 600, letterSpacing: '0.02em' }}
                  >
                    {cat.signalArrow} {cat.signal}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(26,26,18,0.10)', maxWidth: 440 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: ink, opacity: 0.82, borderRadius: 999 }} />
                </div>
                {cat.reason && (
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: '#5A5848', maxWidth: 560 }}>
                    {cleanText(cat.reason)}
                  </p>
                )}
              </div>

              {/* right: score */}
              <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1A1A12' }}>{cat.score}</span>
                <span style={{ fontSize: '0.95rem', color: '#9A9483' }}> / {cat.maxScore}</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
