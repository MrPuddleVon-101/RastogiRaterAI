'use client'
import { StonkyMark } from '@/components/StonkyMark'

// Quiet closing footer at the very bottom: brand and the legal lines, low
// opacity and clean. The Claude token easter egg lives just above this, in its
// own band (see TokenCounterBand in page.tsx).
export function LandingFooter() {
  return (
    <footer className="relative px-6 pt-12 pb-12" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <StonkyMark size={24} />
          <p className="mt-4 text-xs" style={{ color: 'var(--faint)' }}>
            &copy; 2026 Stonky&trade; · Privacy · Disclaimer
          </p>
        </div>
        <p className="text-xs max-w-sm sm:text-right" style={{ color: 'var(--faint)', lineHeight: 1.6 }}>
          Educational research only. Not financial advice. Scores are analytical outputs based on
          publicly available data, not a recommendation to buy, sell, or hold any security.
        </p>
      </div>
    </footer>
  )
}
