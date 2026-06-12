'use client'
import { useState, useMemo } from 'react'
import { MetricEvidence } from '@/lib/types'
import { TooltipTerm } from '@/components/TooltipTerm'
import { cleanText } from '@/lib/utils'

// Graphite cockpit shell: same dark system as every other report card.
const PANEL = 'linear-gradient(180deg, rgba(26,29,36,0.9) 0%, rgba(15,17,21,0.95) 100%)'
const INK = '#ECE7DF'
const INK2 = '#ACA79F'
const INK_MUTED = '#6A6E78'
const POS = '#2E9466'
const NEG = '#B23A3A'

const SIGNAL_COLORS: Record<string, string> = {
  positive: POS, negative: NEG, caution: '#C09A3E', neutral: INK_MUTED,
}
const SIGNAL_ARROWS: Record<string, string> = { positive: '+', negative: '–', caution: '/', neutral: '·' }

const CATEGORIES = ['All', 'Valuation', 'Profitability', 'Cash Flow & Debt', 'Analyst', 'Technical']
const SIGNALS = ['All', 'Positive', 'Caution', 'Negative', 'Neutral']

interface EvidenceTableProps {
  metrics: MetricEvidence[]
  drivers: string[]
  drags: string[]
  neutral: string[]
}

function SummaryTile({ title, color, items, mark }: { title: string; color: string; items: string[]; mark: string }) {
  if (items.length === 0) return null
  return (
    <div style={{ background: 'rgba(236,231,223,0.04)', border: '1px solid var(--border-2)', borderRadius: 12, padding: '1.25rem', borderLeft: `3px solid ${color}` }}>
      <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color, marginBottom: '0.9rem' }}>{title}</p>
      <ul className="space-y-2.5">
        {items.slice(0, 4).map((d, i) => (
          <li key={i} className="text-xs leading-relaxed flex gap-2.5" style={{ color: INK2 }}>
            <span style={{ color, fontFamily: 'var(--font-mono)', flexShrink: 0, fontWeight: 700 }}>{mark}</span>
            {cleanText(d)}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function EvidenceTable({ metrics, drivers, drags, neutral }: EvidenceTableProps) {
  const [catFilter, setCatFilter] = useState('All')
  const [sigFilter, setSigFilter] = useState('All')
  const [showTable, setShowTable] = useState(false)

  const filtered = useMemo(() => metrics.filter(m => {
    const catOk = catFilter === 'All' || m.category.toLowerCase() === catFilter.toLowerCase()
    const sigOk = sigFilter === 'All' || m.signal.toLowerCase() === sigFilter.toLowerCase()
    return catOk && sigOk
  }), [metrics, catFilter, sigFilter])

  const grouped = useMemo(() => {
    const g: Record<string, MetricEvidence[]> = {}
    for (const m of filtered) { if (!g[m.category]) g[m.category] = []; g[m.category].push(m) }
    return g
  }, [filtered])

  return (
    <section className="mt-16">
      <p className="eyebrow mb-5" style={{ color: 'var(--accent)' }}>Evidence</p>

      <div style={{ background: PANEL, border: '1px solid var(--border-2)', borderRadius: 16, boxShadow: '0 18px 44px rgba(0,0,0,0.4), inset 0 1px 0 rgba(236,231,223,0.04)', padding: 'clamp(1.5rem, 3vw, 2rem)', color: INK }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          <SummaryTile title="Supports the case" color={POS} items={drivers} mark="+" />
          <SummaryTile title="Works against it" color={NEG} items={drags} mark="–" />
          <SummaryTile title="Neutral factors" color={INK_MUTED} items={neutral} mark="·" />
        </div>

        <button
          onClick={() => setShowTable(v => !v)}
          className="flex items-center gap-2.5 text-xs transition-all"
          style={{ color: INK_MUTED }}
        >
          <span className="flex items-center justify-center" style={{ width: 16, height: 16, borderRadius: 4, background: 'rgba(236,231,223,0.08)', fontFamily: 'var(--font-mono)' }}>
            {showTable ? '–' : '+'}
          </span>
          {showTable ? 'Hide full metric detail' : 'Show all metrics'}
        </button>

        {showTable && (
          <div className="mt-5">
            <div className="flex flex-wrap gap-2 mb-4">
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="text-xs px-3 py-1.5 rounded-lg outline-none" style={{ background: 'rgba(236,231,223,0.07)', color: INK }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
              </select>
              <div className="flex gap-1">
                {SIGNALS.map(s => (
                  <button key={s} onClick={() => setSigFilter(s)} className="text-xs px-2.5 py-1.5 rounded-lg transition-all"
                    style={{ background: sigFilter === s ? 'rgba(236,231,223,0.92)' : 'rgba(236,231,223,0.06)', color: sigFilter === s ? '#16160F' : INK_MUTED }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="text-sm py-4" style={{ color: INK_MUTED }}>No metrics match this filter.</p>
            ) : (
              <div style={{ borderRadius: 12, overflow: 'hidden', background: 'rgba(236,231,223,0.03)', border: '1px solid var(--border-2)' }}>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr style={{ background: 'rgba(236,231,223,0.05)' }}>
                      {['Metric', 'Value', 'Signal', 'Notes'].map(h => (
                        <th key={h} className={`px-4 py-3 text-[0.62rem] tracking-[0.14em] uppercase font-semibold ${h === 'Value' ? 'text-right' : 'text-left'}`} style={{ color: INK_MUTED }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(grouped).map(([cat, rows]) => (
                      <>
                        <tr key={`cat-${cat}`} style={{ background: 'rgba(236,231,223,0.04)' }}>
                          <td colSpan={4} className="px-4 py-2 text-[0.62rem] font-semibold tracking-[0.14em] uppercase" style={{ color: 'var(--accent)' }}>{cat}</td>
                        </tr>
                        {rows.map((m, i) => {
                          const sigKey = m.signal.toLowerCase()
                          const color = SIGNAL_COLORS[sigKey] || INK_MUTED
                          const arrow = SIGNAL_ARROWS[sigKey] || '·'
                          return (
                            <tr key={`${cat}-${i}`} style={{ borderTop: '1px solid rgba(236,231,223,0.07)' }}>
                              <td className="px-4 py-3 font-medium" style={{ color: INK }}>
                                <TooltipTerm term={m.metric}>{m.metric}</TooltipTerm>
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 500, color: INK }}>{m.value}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-xs font-medium" style={{ color }}>{arrow} {m.signal.charAt(0).toUpperCase() + m.signal.slice(1)}</td>
                              <td className="px-4 py-3 text-xs leading-relaxed" style={{ color: INK2 }}>{cleanText(m.notes)}</td>
                            </tr>
                          )
                        })}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
