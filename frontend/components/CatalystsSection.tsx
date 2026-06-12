'use client'
import { Catalysts as CatalystData } from '@/lib/types'
import { TooltipTerm } from '@/components/TooltipTerm'
import { cleanText } from '@/lib/utils'

const PANEL = 'linear-gradient(168deg, #ECE6DA 0%, #E1DACB 120%)'
const INK = '#1A1A12'
const INK2 = '#46453A'
const INK_MUTED = '#7C7660'
const POS = '#2F7048'
const NEG = '#963232'

function Block({ title, items, color, mark }: { title: string; items: string[]; color: string; mark: string }) {
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

export function CatalystsSection({ catalysts }: { catalysts: CatalystData }) {
  return (
    <section className="mt-16">
      <p className="eyebrow mb-5" style={{ color: 'var(--accent)' }}>
        <TooltipTerm term="Catalyst"><span style={{ color: 'var(--accent)' }}>Catalysts and Future Direction</span></TooltipTerm>
      </p>

      <div style={{ background: PANEL, borderRadius: 20, boxShadow: '0 30px 70px rgba(0,0,0,0.5)', padding: 'clamp(1.75rem, 4vw, 2.5rem)', color: INK }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
          <Block title="Potential near-term catalysts" items={catalysts.nearTerm} color={POS} mark="+" />
          <Block title="What investors may watch next" items={catalysts.whatToWatch} color={INK_MUTED} mark="·" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <Block title="Long-term company direction" items={catalysts.longTermDirection} color={INK_MUTED} mark="·" />
          <Block title="Catalyst risk" items={catalysts.risks} color={NEG} mark="–" />
        </div>
        <p className="mt-7" style={{ fontSize: '0.76rem', color: INK_MUTED }}>
          Potential catalysts are possibilities, not forecasts. This is educational context, not advice.
        </p>
      </div>
    </section>
  )
}
