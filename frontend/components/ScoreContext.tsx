'use client'
import { RatingResponse } from '@/lib/types'

const WHY: Record<string, string> = {
  valuation: 'Valuation is stretched relative to earnings and sales.',
  analyst: 'Analyst targets and coverage are only moderately constructive.',
  profitability: 'Margins and returns leave some room to improve.',
  cashflow: 'Cash flow or leverage sits below the preferred range.',
  technical: 'Short-term momentum has cooled.',
  confidence: 'Some reported data was incomplete, which caps confidence.',
}

const IMPROVE: Record<string, string> = {
  valuation: 'Lower valuation multiples, or earnings growing into the price.',
  analyst: 'Stronger analyst coverage and more constructive targets.',
  profitability: 'Higher margins and stronger returns on capital.',
  cashflow: 'Stronger free cash flow growth and lower leverage.',
  technical: 'A cleaner technical recovery above the 50-day average.',
  confidence: 'More complete reported data across the categories.',
}

// Graphite cockpit shell: same dark system as every other report card.
const PANEL = 'linear-gradient(180deg, rgba(26,29,36,0.9) 0%, rgba(15,17,21,0.95) 100%)'
const INK = '#ECE7DF'
const INK2 = '#ACA79F'
const INK_MUTED = '#6A6E78'

// Score bands, width-proportional. Muted matte colors against graphite.
const BANDS = [
  { label: 'High Risk', from: 0, to: 40, color: '#9A3A3A' },
  { label: 'Weak', from: 40, to: 55, color: '#A86E38' },
  { label: 'Mixed', from: 55, to: 70, color: '#A8842F' },
  { label: 'Strong', from: 70, to: 85, color: '#3E7A55' },
  { label: 'Elite', from: 85, to: 100, color: '#2E9466' },
]

function ScoreBand({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score))
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)' }}>
          Where this score sits
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: INK, fontWeight: 600 }}>
          {score}<span style={{ color: INK_MUTED }}> / 100</span>
        </span>
      </div>

      {/* marker */}
      <div style={{ position: 'relative', height: 14, marginBottom: 6 }}>
        <div
          style={{
            position: 'absolute', left: `${clamped}%`, top: 0, transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
            borderTop: '7px solid #ECE7DF',
          }}
        />
        <div style={{ position: 'absolute', left: `${clamped}%`, top: 7, transform: 'translateX(-50%)', width: 2, height: 7, background: '#ECE7DF' }} />
      </div>

      {/* band track */}
      <div className="flex overflow-hidden" style={{ borderRadius: 6, height: 10 }}>
        {BANDS.map(b => (
          <div key={b.label} style={{ width: `${b.to - b.from}%`, background: b.color, opacity: 0.78 }} />
        ))}
      </div>

      {/* band labels */}
      <div className="flex mt-1.5">
        {BANDS.map(b => (
          <div key={b.label} style={{ width: `${b.to - b.from}%`, textAlign: 'center' }}>
            <span style={{ fontSize: '0.6rem', color: INK_MUTED, letterSpacing: '0.02em' }}>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function List({ title, mark, color, items }: { title: string; mark: string; color: string; items: string[] }) {
  return (
    <div>
      <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color, marginBottom: '0.9rem' }}>
        {title}
      </p>
      <ul className="space-y-2.5">
        {items.map((t, i) => (
          <li key={i} className="flex gap-2.5" style={{ fontSize: '0.9rem', lineHeight: 1.55, color: INK2 }}>
            <span style={{ color, fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0 }}>{mark}</span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ScoreContext({ data }: { data: RatingResponse }) {
  const gaps = data.categoryScores
    .map(c => ({ key: c.key, gap: c.maxScore - c.score }))
    .filter(c => c.gap > 0.5)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 4)

  const whyItems = gaps.length
    ? gaps.map(g => WHY[g.key]).filter(Boolean)
    : ['Very little held this score back. It already sits near the top of the scale.']
  const improveItems = gaps.length
    ? gaps.map(g => IMPROVE[g.key]).filter(Boolean)
    : ['Holding the current fundamentals would keep the score high.']

  return (
    // A cockpit card: lives in the report's left column under Score DNA so
    // its bottom lines up with the end of the intelligence rail.
    <div className="mt-5">
      <div style={{ background: PANEL, border: '1px solid var(--border-2)', borderRadius: 16, boxShadow: '0 18px 44px rgba(0,0,0,0.4), inset 0 1px 0 rgba(236,231,223,0.04)', padding: 'clamp(1.25rem, 2.6vw, 1.75rem)', color: INK }}>
        <p className="text-[0.62rem] tracking-[0.18em] uppercase mb-4" style={{ color: 'var(--accent)', fontWeight: 600 }}>Reading the Score</p>
        <ScoreBand score={data.overallScore} />

        <div style={{ height: 1, background: 'rgba(236,231,223,0.08)', marginBottom: '1.75rem' }} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <List title="Why not 100?" mark="–" color="#B23A3A" items={whyItems} />
          <List title="What would improve the score?" mark="+" color="#2E9466" items={improveItems} />
        </div>

        <p className="mt-7" style={{ fontSize: '0.78rem', lineHeight: 1.6, color: INK_MUTED, maxWidth: 640 }}>
          These notes are educational and describe the scoring model only. They are not advice and not a
          recommendation to buy, sell, or hold any security.
        </p>
      </div>
    </div>
  )
}
