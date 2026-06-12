'use client'
import { EconomicMoat as MoatData } from '@/lib/types'
import { TooltipTerm } from '@/components/TooltipTerm'
import { cleanText } from '@/lib/utils'

const PANEL = 'linear-gradient(168deg, #ECE6DA 0%, #E1DACB 120%)'
const INK = '#1A1A12'
const INK2 = '#46453A'
const INK_MUTED = '#7C7660'

function levelColor(level: string): string {
  const l = level.toLowerCase()
  if (l.includes('very strong')) return '#2F7048'
  if (l.includes('strong')) return '#2F7048'
  if (l.includes('moderate')) return '#8A6A22'
  if (l.includes('weak')) return '#963232'
  return INK_MUTED
}

// Sources that have a hover definition.
const SOURCE_TERMS = new Set([
  'Brand strength', 'Network effects', 'Switching costs', 'Cost advantage',
  'Scale advantage', 'Intellectual property',
])
function sourceTerm(src: string): string | null {
  if (SOURCE_TERMS.has(src)) return src
  if (src.startsWith('Intellectual property')) return 'Intellectual property'
  return null
}

export function EconomicMoat({ moat }: { moat: MoatData }) {
  const color = levelColor(moat.level)
  return (
    <section className="mt-16">
      <p className="eyebrow mb-5" style={{ color: 'var(--accent)' }}>
        <TooltipTerm term="Economic moat"><span style={{ color: 'var(--accent)' }}>Economic Moat</span></TooltipTerm>
      </p>

      <div style={{ background: PANEL, borderRadius: 20, boxShadow: '0 30px 70px rgba(0,0,0,0.5)', padding: 'clamp(1.75rem, 4vw, 2.5rem)', color: INK }}>
        <div className="flex items-center gap-3 flex-wrap mb-5">
          <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK_MUTED }}>Moat level</span>
          <span className="px-3 py-1 rounded-full" style={{ background: 'rgba(26,26,18,0.06)', color, fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.02em' }}>
            {moat.level}
          </span>
        </div>

        {moat.sources?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {moat.sources.map((s, i) => {
              const term = sourceTerm(s)
              const chip = (
                <span className="px-2.5 py-1 rounded-md" style={{ background: 'rgba(26,26,18,0.07)', color: INK2, fontSize: '0.8rem' }}>{s}</span>
              )
              return <span key={i}>{term ? <TooltipTerm term={term}>{chip}</TooltipTerm> : chip}</span>
            })}
          </div>
        )}

        <p style={{ fontSize: '0.98rem', lineHeight: 1.7, color: INK2, maxWidth: 760, marginBottom: '1.5rem' }}>
          {cleanText(moat.explanation)}
        </p>

        <div style={{ borderTop: '1px solid rgba(26,26,18,0.1)', paddingTop: '1.25rem' }}>
          <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_MUTED, marginBottom: '0.6rem' }}>Moat risk</p>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: INK2, maxWidth: 760 }}>{cleanText(moat.risk)}</p>
        </div>
      </div>
    </section>
  )
}
