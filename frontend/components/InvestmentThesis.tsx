'use client'
import { InvestmentThesis as ThesisData } from '@/lib/types'
import { TooltipTerm } from '@/components/TooltipTerm'
import { cleanText } from '@/lib/utils'

const PANEL = 'linear-gradient(168deg, #ECE6DA 0%, #DFD8C8 120%)'
const INK = '#1A1A12'
const INK2 = '#46453A'
const INK_MUTED = '#7C7660'
const POS = '#2F7048'
const NEG = '#963232'
const GOLD = '#9A7B2E'

function Bullets({ title, items, color, mark }: { title: React.ReactNode; items: string[]; color: string; mark: string }) {
  if (!items?.length) return null
  return (
    <div>
      <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color, marginBottom: '0.85rem' }}>{title}</p>
      <ul className="space-y-2.5">
        {items.map((t, i) => (
          <li key={i} className="flex gap-2.5" style={{ fontSize: '0.95rem', lineHeight: 1.6, color: '#2A2A1F' }}>
            <span style={{ color, fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0 }}>{mark}</span>
            {cleanText(t)}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function InvestmentThesis({ thesis }: { thesis: ThesisData }) {
  return (
    <section className="mt-16">
      <p className="eyebrow mb-5" style={{ color: 'var(--accent)' }}>
        <TooltipTerm term="Investment Thesis"><span style={{ color: 'var(--accent)' }}>Investment Thesis</span></TooltipTerm>
      </p>

      <div style={{ background: PANEL, borderRadius: 20, boxShadow: '0 34px 80px rgba(0,0,0,0.55)', padding: 'clamp(1.75rem, 4vw, 2.75rem)', color: INK }}>
        <div style={{ position: 'relative' }}>
          <span className="inline-block px-3 py-1 rounded-full mb-3" style={{ background: INK, color: '#ECE6DA', fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {thesis.label}
          </span>
          {thesis.summary && (
            <p style={{ fontSize: 'clamp(1.2rem, 2.6vw, 1.65rem)', fontWeight: 600, lineHeight: 1.25, letterSpacing: '-0.02em', color: '#16160F', maxWidth: 720, marginBottom: '1.9rem' }}>
              {cleanText(thesis.summary)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-9">
          <Bullets title={<TooltipTerm term="Bullish case"><span style={{ color: POS }}>Bullish case</span></TooltipTerm>} items={thesis.bullCase} color={POS} mark="+" />
          <Bullets title={<TooltipTerm term="Bearish case"><span style={{ color: NEG }}>Bearish case</span></TooltipTerm>} items={thesis.bearCase} color={NEG} mark="–" />
        </div>

        {thesis.marketMayBeMissing?.length > 0 && (
          <div style={{ background: 'rgba(154,123,46,0.12)', borderRadius: 12, padding: '1.1rem 1.25rem', marginBottom: '1.9rem', borderLeft: `3px solid ${GOLD}` }}>
            <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD, marginBottom: '0.7rem' }}>
              <TooltipTerm term="Market may be missing"><span style={{ color: GOLD }}>What the market may be missing</span></TooltipTerm>
            </p>
            <ul className="space-y-1.5">
              {thesis.marketMayBeMissing.map((t, i) => (
                <li key={i} style={{ fontSize: '0.92rem', lineHeight: 1.55, color: '#2A2A1F' }}>{cleanText(t)}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <Bullets title="What would need to be true" items={thesis.whatNeedsToBeTrue} color={INK_MUTED} mark="·" />
          <Bullets title="What could break the thesis" items={thesis.whatCouldBreak} color={INK_MUTED} mark="·" />
        </div>

        <p className="mt-7" style={{ fontSize: '0.76rem', color: INK_MUTED, letterSpacing: '0.02em' }}>
          An educational thesis built from public data. Not a recommendation to buy, sell, or hold.
        </p>
      </div>
    </section>
  )
}
