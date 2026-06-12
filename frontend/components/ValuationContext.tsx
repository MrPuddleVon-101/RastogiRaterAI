'use client'
import { ValuationContext as VCData } from '@/lib/types'
import { TooltipTerm } from '@/components/TooltipTerm'
import { cleanText } from '@/lib/utils'

// Graphite cockpit shell: same dark system as every other report card.
const PANEL = 'linear-gradient(180deg, rgba(26,29,36,0.9) 0%, rgba(15,17,21,0.95) 100%)'
const INK = '#ECE7DF'
const INK2 = '#ACA79F'
const INK_MUTED = '#6A6E78'
const POS = '#2E9466'
const NEG = '#B23A3A'
const GOLD = '#C9A24C'

function statusColor(s: string): string {
  const l = s.toLowerCase()
  if (l.includes('undervalued')) return POS
  if (l.includes('fairly')) return GOLD
  if (l.includes('stretched') || l.includes('expensive')) return NEG
  return INK_MUTED
}

function sensitivityColor(s: string): string {
  const l = (s || '').toLowerCase()
  if (l === 'low') return POS
  if (l === 'medium') return GOLD
  return '#A8703A'
}

function sensitivityCaption(s: string): string {
  const l = (s || '').toLowerCase()
  if (l === 'low') return 'Fair value stays relatively stable across reasonable assumption changes.'
  if (l === 'medium') return 'Fair value shifts meaningfully as growth, margins, or the discount rate change.'
  return 'Small changes in growth, margins, discount rate, or terminal value can move this fair value a lot.'
}

function FairValueCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ background: 'rgba(236,231,223,0.05)', border: '1px solid var(--border-2)', borderRadius: 12, padding: '1.1rem 0.75rem', textAlign: 'center' }}>
      <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK_MUTED, marginBottom: '0.5rem' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 600, color: accent, lineHeight: 1 }}>{value}</p>
    </div>
  )
}

export function ValuationContext({ vc }: { vc: VCData }) {
  const sc = statusColor(vc.status)
  const fv = vc.fairValueView
  const senseColor = sensitivityColor(fv.sensitivity || '')

  return (
    <section className="mt-16">
      <p className="eyebrow mb-5" style={{ color: 'var(--accent)' }}>
        <TooltipTerm term="Valuation"><span style={{ color: 'var(--accent)' }}>Valuation Context</span></TooltipTerm>
      </p>

      <div style={{ background: PANEL, border: '1px solid var(--border-2)', borderRadius: 16, boxShadow: '0 18px 44px rgba(0,0,0,0.4), inset 0 1px 0 rgba(236,231,223,0.04)', padding: 'clamp(1.5rem, 3vw, 2.25rem)', color: INK }}>
        {/* status + multiple read */}
        <div className="flex items-center gap-3 flex-wrap mb-3.5">
          <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK_MUTED }}>
            <TooltipTerm term="Fair value"><span style={{ color: INK_MUTED }}>Fair value status</span></TooltipTerm>
          </span>
          <span className="px-3 py-1 rounded-full" style={{ background: 'rgba(236,231,223,0.06)', color: sc, fontWeight: 700, fontSize: '0.92rem' }}>{vc.status}</span>
        </div>
        <p style={{ fontSize: '1.02rem', lineHeight: 1.7, color: INK2, maxWidth: 720 }}>
          {cleanText(vc.multipleRead)}
        </p>

        {/* Simplified DCF */}
        <div style={{ borderTop: '1px solid rgba(236,231,223,0.08)', marginTop: '1.6rem', paddingTop: '1.5rem' }}>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK_MUTED }}>
              <TooltipTerm term="DCF"><span style={{ color: INK_MUTED }}>Simplified fair value (DCF)</span></TooltipTerm>
            </p>
            {fv.available && fv.sensitivity && (
              <span className="inline-flex items-center gap-1.5" style={{ fontSize: '0.72rem', color: INK_MUTED }}>
                DCF sensitivity
                <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(236,231,223,0.06)', color: senseColor, fontWeight: 700, fontSize: '0.72rem' }}>{fv.sensitivity}</span>
              </span>
            )}
          </div>

          {fv.available ? (
            <>
              <div className="grid grid-cols-3 gap-3 mx-auto" style={{ maxWidth: 460, marginBottom: '0.9rem' }}>
                <FairValueCard label="Bear" value={fv.bearCase} accent={NEG} />
                <FairValueCard label="Base" value={fv.baseCase} accent={INK} />
                <FairValueCard label="Bull" value={fv.bullCase} accent={POS} />
              </div>

              {fv.sensitivity && (
                <p className="text-center mx-auto" style={{ fontSize: '0.82rem', color: INK_MUTED, maxWidth: 520, marginBottom: '1.4rem' }}>
                  {sensitivityCaption(fv.sensitivity)}
                </p>
              )}

              {fv.interpretation && (
                <p style={{ fontSize: '1.0rem', lineHeight: 1.7, color: INK2, maxWidth: 720, marginBottom: '1rem' }}>
                  {cleanText(fv.interpretation)}
                </p>
              )}

              <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: INK2, maxWidth: 720, marginBottom: '1rem', fontStyle: 'italic' }}>
                This is a rough educational range, not a precise price target.
              </p>

              <ul className="space-y-1.5" style={{ maxWidth: 720 }}>
                {fv.assumptions.map((a, i) => (
                  <li key={i} className="flex gap-2.5" style={{ fontSize: '0.82rem', lineHeight: 1.5, color: INK_MUTED }}>
                    <span style={{ flexShrink: 0 }}>·</span>{cleanText(a)}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: INK2, maxWidth: 720 }}>
              A simplified DCF range is not shown for this ticker because free cash flow data is unavailable.
              The valuation read above relies on multiples and business quality instead.
            </p>
          )}
        </div>

        {/* Peer context */}
        <div style={{ borderTop: '1px solid rgba(236,231,223,0.08)', marginTop: '1.5rem', paddingTop: '1.25rem' }}>
          <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK_MUTED, marginBottom: '0.55rem' }}>
            <TooltipTerm term="Trading comps"><span style={{ color: INK_MUTED }}>Peer context</span></TooltipTerm>
          </p>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: INK2, maxWidth: 720 }}>{cleanText(vc.tradingComps.summary)}</p>
        </div>
      </div>
    </section>
  )
}
