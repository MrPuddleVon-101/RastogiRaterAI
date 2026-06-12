'use client'

// The scoring framework lives here now, inside the report, instead of gating
// the landing page. Same six tests, same hundred points.
const CATEGORIES = [
  {
    name: 'Valuation', max: 20,
    question: 'Is the price asking too much?',
    explanation: 'Checks how much investors are paying for earnings, sales, and assets. Rewards reasonable multiples with room for disappointment.',
    note: 'P/E, Forward P/E, Price/Sales, Price/Book',
  },
  {
    name: 'Profitability', max: 20,
    question: 'Does revenue become real profit?',
    explanation: 'Checks whether the company actually keeps money after costs. Rewards strong margins and high returns on capital.',
    note: 'Net margin, operating margin, ROE, ROA',
  },
  {
    name: 'Cash Flow & Debt', max: 20,
    question: 'Is there cash behind the story?',
    explanation: 'Checks whether profits are backed by real cash and manageable obligations. Rewards free cash flow and controlled leverage.',
    note: 'Free cash flow, debt/equity, current ratio',
  },
  {
    name: 'Analyst Expectations', max: 15,
    question: 'Do analysts see upside?',
    explanation: 'Reads professional estimates as a signal, not as proof. Rewards real coverage depth and constructive targets.',
    note: 'Price targets, coverage depth, consensus',
  },
  {
    name: 'Technical Position', max: 15,
    question: 'Has the chart cooled or cracked?',
    explanation: 'Checks whether the stock has pulled back cleanly or broken down more seriously. Rewards healthy pullbacks and trend support.',
    note: '52W high gap, moving averages, momentum',
  },
  {
    name: 'Data Confidence', max: 10,
    question: 'How complete is the evidence?',
    explanation: 'Checks whether the score is based on enough usable information. Rewards complete enough data to make the score meaningful.',
    note: 'Data completeness across all categories',
  },
]

// Graphite cockpit shell: same dark system as every other report card.
const PANEL = 'linear-gradient(180deg, rgba(26,29,36,0.9) 0%, rgba(15,17,21,0.95) 100%)'

export function MethodSection() {
  return (
    <section className="mt-16">
      <p className="eyebrow mb-5" style={{ color: 'var(--accent)' }}>How the Score Works</p>

      <div style={{ background: PANEL, border: '1px solid var(--border-2)', borderRadius: 16, boxShadow: '0 18px 44px rgba(0,0,0,0.4), inset 0 1px 0 rgba(236,231,223,0.04)', padding: 'clamp(1.5rem, 3vw, 2.25rem)', color: 'var(--text)' }}>
        <p className="mb-6" style={{ fontSize: '0.95rem', lineHeight: 1.65, color: 'var(--text-2)', maxWidth: 620 }}>
          Every stock runs through the same six tests, worth one hundred points in total.
          The score is a pressure test on the publicly available case, not a recommendation.
        </p>

        <div>
          {CATEGORIES.map((c, i) => (
            <div
              key={c.name}
              className="grid md:grid-cols-[190px_1fr_auto] grid-cols-1 gap-x-6 gap-y-1.5 py-4 items-baseline"
              style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(236,231,223,0.07)' }}
            >
              <div>
                <p style={{ fontSize: '0.95rem', color: 'var(--text)', fontWeight: 600, letterSpacing: '-0.01em' }}>{c.name}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--faint)', fontFamily: 'var(--font-mono)' }}>{c.note}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text)', fontWeight: 500, marginBottom: 2 }}>{c.question}</p>
                <p style={{ fontSize: '0.8rem', lineHeight: 1.6, color: 'var(--text-2)', maxWidth: 520 }}>{c.explanation}</p>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--accent-2)', whiteSpace: 'nowrap' }}>
                {c.max} pts
              </span>
            </div>
          ))}
        </div>

        <p className="mt-5" style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--muted)', maxWidth: 600 }}>
          One hundred points in total. The score is an analytical output, not a recommendation to buy, sell, or hold.
        </p>
      </div>
    </section>
  )
}
