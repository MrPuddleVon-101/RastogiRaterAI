'use client'
import { RatingResponse } from '@/lib/types'
import { cleanText } from '@/lib/utils'

const IVORY = 'linear-gradient(168deg, #ECE6DA 0%, #DFD8C8 120%)'

interface Bullet { sign: '+' | '–'; text: string; color: string }

export function RastogiVerdict({ data }: { data: RatingResponse }) {
  const coldTake = cleanText(data.oneLineVerdict || data.nuancedLabel || '')

  // A short paragraph: first few sentences of the analyst verdict.
  const sentences = cleanText(data.rastogiVerdictAnalyst)
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean)
  const paragraph = sentences.slice(0, 4).join(' ')

  // Three clean supporting bullets from the evidence the model already built.
  const bullets: Bullet[] = []
  for (const d of data.drivers.slice(0, 2)) bullets.push({ sign: '+', text: cleanText(d), color: '#2F7048' })
  for (const d of data.drags.slice(0, 1)) bullets.push({ sign: '–', text: cleanText(d), color: '#963232' })
  if (bullets.length < 3) {
    for (const d of data.neutral.slice(0, 3 - bullets.length)) bullets.push({ sign: '+', text: cleanText(d), color: '#8A6A22' })
  }

  return (
    <section className="mt-16">
      <p className="eyebrow mb-5" style={{ color: 'var(--accent)' }}>The Rastogi Verdict</p>

      <div
        className="relative overflow-hidden"
        style={{ background: IVORY, borderRadius: 20, boxShadow: '0 34px 80px rgba(0,0,0,0.55)', padding: 'clamp(2rem, 4.5vw, 3.2rem)', color: '#1A1A12' }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, height: 4, width: '100%', background: 'linear-gradient(90deg, #9A7B2E 0%, transparent 55%)', opacity: 0.55 }} />

        {coldTake && (
          <p style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.02em', color: '#16160F', marginBottom: '1.25rem', maxWidth: 760 }}>
            {coldTake}
          </p>
        )}

        {paragraph && (
          <p style={{ fontSize: '1.02rem', lineHeight: 1.75, color: '#46453A', marginBottom: '1.75rem', maxWidth: 760 }}>
            {paragraph}
          </p>
        )}

        {bullets.length > 0 && (
          <ul className="space-y-2.5" style={{ marginBottom: '1.75rem' }}>
            {bullets.map((b, i) => (
              <li key={i} className="flex gap-3" style={{ fontSize: '0.95rem', lineHeight: 1.55, color: '#2A2A1F' }}>
                <span style={{ color: b.color, fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0 }}>{b.sign}</span>
                {b.text}
              </li>
            ))}
          </ul>
        )}

        <p style={{ fontSize: '0.78rem', color: '#7C7660', letterSpacing: '0.03em' }}>
          A pressure test on the public case. Not a recommendation to buy, sell, or hold.
        </p>
      </div>
    </section>
  )
}
