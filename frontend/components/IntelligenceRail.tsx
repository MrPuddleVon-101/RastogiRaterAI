'use client'
import { useState } from 'react'
import { RatingResponse } from '@/lib/types'
import { TooltipTerm } from '@/components/TooltipTerm'
import { cleanText, currencySymbol } from '@/lib/utils'

// The cockpit's right-hand intelligence rail: thesis, moat, valuation summary,
// catalysts, risks, analyst consensus, and earnings history as compact dark
// instrument cards. Every card degrades to an honest fallback when the data
// source has nothing; numbers are never invented.

const INK = 'var(--text)'
const SUB = 'var(--text-2)'
const MUTED = 'var(--muted)'
const POS = 'var(--pos)'
const NEG = 'var(--neg)'
const CAUT = 'var(--caut)'
const GOLD = 'var(--accent)'

function RailCard({ title, term, children }: { title: string; term?: string; children: React.ReactNode }) {
  return (
    <div
      className="rr-lift"
      style={{
        background: 'linear-gradient(180deg, rgba(26,29,36,0.9) 0%, rgba(15,17,21,0.95) 100%)',
        border: '1px solid var(--border-2)',
        borderRadius: 16,
        boxShadow: '0 18px 44px rgba(0,0,0,0.4), inset 0 1px 0 rgba(236,231,223,0.04)',
        padding: '1.1rem 1.2rem',
      }}
    >
      <p className="text-[0.62rem] tracking-[0.18em] uppercase mb-3" style={{ color: GOLD, fontWeight: 600 }}>
        {term ? <TooltipTerm term={term}>{title}</TooltipTerm> : title}
      </p>
      {children}
    </div>
  )
}

function MoreList({ label, items, mark = '·' }: { label: string; items: string[]; mark?: string }) {
  const [open, setOpen] = useState(false)
  if (!items?.length) return null
  return (
    <div className="mt-3">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 text-xs transition-colors" style={{ color: MUTED }}>
        <span className="flex items-center justify-center" style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(236,231,223,0.07)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
          {open ? '–' : '+'}
        </span>
        {label}
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5">
          {items.map((t, i) => (
            <li key={i} className="flex gap-2 text-xs leading-relaxed" style={{ color: SUB }}>
              <span style={{ color: MUTED, flexShrink: 0 }}>{mark}</span>
              {cleanText(t)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Bullets({ items, color, mark, max = 3 }: { items: string[]; color: string; mark: string; max?: number }) {
  if (!items?.length) return null
  return (
    <ul className="space-y-1.5">
      {items.slice(0, max).map((t, i) => (
        <li key={i} className="flex gap-2 text-xs leading-relaxed" style={{ color: SUB }}>
          <span style={{ color, fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0 }}>{mark}</span>
          {cleanText(t)}
        </li>
      ))}
    </ul>
  )
}

function Chip({ text, color }: { text: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color, background: 'rgba(236,231,223,0.06)' }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color, display: 'inline-block' }} />
      {text}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Analyst Consensus card
// ---------------------------------------------------------------------------

function AnalystConsensusCard({ data }: { data: RatingResponse }) {
  const ac = data.analystConsensus
  const sym = currencySymbol(data.currency)

  if (!ac || !ac.available) {
    return (
      <RailCard title="Analyst Consensus" term="Analyst consensus">
        <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
          Analyst consensus unavailable for this ticker.
        </p>
      </RailCard>
    )
  }

  const totalVotes = ac.counts ? ac.counts.bullish + ac.counts.neutral + ac.counts.bearish : null
  const labelColor = ac.label
    ? (ac.label.toLowerCase().includes('buy') ? POS : ac.label.toLowerCase().includes('sell') || ac.label.toLowerCase().includes('under') ? NEG : CAUT)
    : SUB

  const lo = ac.targetLow
  const hi = ac.targetHigh
  const mean = ac.targetMean
  const cur = ac.currentPrice
  const hasRange = lo != null && hi != null && hi > lo
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - (lo as number)) / ((hi as number) - (lo as number))) * 100))

  return (
    <RailCard title="Analyst Consensus" term="Analyst consensus">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        {ac.label && <span style={{ fontSize: '1.15rem', fontWeight: 700, color: labelColor, letterSpacing: '-0.01em' }}>{ac.label}</span>}
        <span className="text-xs" style={{ color: MUTED }}>
          {totalVotes || ac.analystCount || '–'} analysts
        </span>
      </div>

      {ac.counts && totalVotes ? (
        <div className="mb-4">
          <div className="flex h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(236,231,223,0.07)' }}>
            <div style={{ width: `${(ac.counts.bullish / totalVotes) * 100}%`, background: POS }} />
            <div style={{ width: `${(ac.counts.neutral / totalVotes) * 100}%`, background: CAUT }} />
            <div style={{ width: `${(ac.counts.bearish / totalVotes) * 100}%`, background: NEG }} />
          </div>
          <div className="flex justify-between text-[0.66rem]" style={{ fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: POS }}>{ac.counts.bullish} bullish</span>
            <span style={{ color: CAUT }}>{ac.counts.neutral} neutral</span>
            <span style={{ color: NEG }}>{ac.counts.bearish} bearish</span>
          </div>
        </div>
      ) : (
        <p className="text-[0.68rem] mb-4" style={{ color: 'var(--faint)' }}>Vote breakdown unavailable.</p>
      )}

      {hasRange ? (
        <div>
          <p className="text-[0.62rem] tracking-[0.14em] uppercase mb-2" style={{ color: 'var(--faint)' }}>
            <TooltipTerm term="Analyst target">12-month target range</TooltipTerm>
          </p>
          <div className="relative" style={{ height: 26 }}>
            <div className="absolute left-0 right-0 rounded-full" style={{ top: 11, height: 4, background: 'linear-gradient(90deg, rgba(178,58,58,0.45), rgba(192,154,62,0.45), rgba(46,148,102,0.45))' }} />
            {mean != null && (
              <div className="absolute" style={{ left: `${pct(mean)}%`, top: 7, transform: 'translateX(-50%)' }}>
                <div style={{ width: 11, height: 11, borderRadius: 999, background: 'var(--accent-2)', border: '2px solid rgba(13,15,19,1)' }} />
              </div>
            )}
            {cur != null && (
              <div className="absolute flex flex-col items-center" style={{ left: `${pct(cur)}%`, top: 0, transform: 'translateX(-50%)' }}>
                <div style={{ width: 2, height: 26, background: INK, borderRadius: 2, opacity: 0.9 }} />
              </div>
            )}
          </div>
          <div className="flex justify-between mt-1 text-[0.7rem]" style={{ fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: NEG }}>{sym}{lo!.toFixed(0)} low</span>
            {mean != null && <span style={{ color: 'var(--accent-2)' }}>{sym}{mean.toFixed(0)} avg</span>}
            <span style={{ color: POS }}>{sym}{hi!.toFixed(0)} high</span>
          </div>
          {cur != null && (
            <p className="text-[0.66rem] mt-1.5" style={{ color: MUTED }}>
              Ivory marker: current price {sym}{cur.toFixed(2)}
            </p>
          )}
        </div>
      ) : (
        <p className="text-[0.68rem]" style={{ color: 'var(--faint)' }}>Target range unavailable.</p>
      )}

      <p className="text-[0.64rem] leading-relaxed mt-3 pt-2.5" style={{ color: 'var(--faint)', borderTop: '1px solid var(--border-2)' }}>
        Third-party analyst data, not a Stonky recommendation.
      </p>
    </RailCard>
  )
}

// ---------------------------------------------------------------------------
// Earnings History card
// ---------------------------------------------------------------------------

function EarningsHistoryCard({ data }: { data: RatingResponse }) {
  const [tab, setTab] = useState<'EPS' | 'Revenue'>('EPS')
  const eh = data.earningsHistory

  if (!eh || !eh.available || eh.quarters.length === 0) {
    return (
      <RailCard title="Earnings History" term="Earnings beat">
        <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
          Earnings history unavailable for this ticker.
        </p>
      </RailCard>
    )
  }

  const quarters = eh.quarters
  const resultColor = (r: string | null) => (r === 'beat' ? POS : r === 'miss' ? NEG : CAUT)
  const fmtPeriod = (p: string) => {
    const d = new Date(p + 'T00:00:00')
    return isNaN(d.getTime()) ? p : d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }

  // Scale dots across the EPS value range
  const vals = quarters.flatMap(q => [q.epsEstimate, q.epsActual]).filter((v): v is number => v != null)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const yFor = (v: number) => 8 + (1 - (v - min) / span) * 54 // 8..62 within 70px height

  return (
    <RailCard title="Earnings History" term="Earnings beat">
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex p-0.5 rounded-lg" style={{ background: 'rgba(236,231,223,0.06)' }}>
          {(['EPS', 'Revenue'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-2.5 py-1 rounded-md text-xs"
              style={{
                background: tab === t ? 'rgba(236,231,223,0.92)' : 'transparent',
                color: tab === t ? '#16160F' : MUTED,
                fontWeight: tab === t ? 600 : 500,
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="text-[0.66rem]" style={{ color: 'var(--faint)' }}>
          <TooltipTerm term="EPS">estimate vs actual</TooltipTerm>
        </span>
      </div>

      {tab === 'Revenue' ? (
        <p className="text-xs leading-relaxed py-3" style={{ color: MUTED }}>
          Revenue estimate history is unavailable from the data source for this ticker.
          EPS history is shown instead.
        </p>
      ) : (
        <>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${quarters.length}, 1fr)` }}>
            {quarters.map((q, i) => (
              <div key={i} className="relative" style={{ height: 70 }}>
                {/* connector */}
                {q.epsEstimate != null && q.epsActual != null && (
                  <div
                    className="absolute left-1/2"
                    style={{
                      top: Math.min(yFor(q.epsEstimate), yFor(q.epsActual)) + 4,
                      height: Math.abs(yFor(q.epsEstimate) - yFor(q.epsActual)),
                      width: 1.5,
                      background: 'rgba(236,231,223,0.14)',
                      transform: 'translateX(-50%)',
                    }}
                  />
                )}
                {q.epsEstimate != null && (
                  <div
                    className="absolute left-1/2"
                    title={`Estimate ${q.epsEstimate.toFixed(2)}`}
                    style={{
                      top: yFor(q.epsEstimate), transform: 'translate(-50%, 0)',
                      width: 9, height: 9, borderRadius: 999,
                      border: '1.5px solid rgba(236,231,223,0.5)', background: 'transparent',
                    }}
                  />
                )}
                {q.epsActual != null && (
                  <div
                    className="absolute left-1/2"
                    title={`Actual ${q.epsActual.toFixed(2)}`}
                    style={{
                      top: yFor(q.epsActual), transform: 'translate(-50%, 0)',
                      width: 9, height: 9, borderRadius: 999,
                      background: resultColor(q.result),
                      boxShadow: `0 0 8px ${q.result === 'beat' ? 'rgba(46,148,102,0.5)' : q.result === 'miss' ? 'rgba(178,58,58,0.5)' : 'rgba(192,154,62,0.45)'}`,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="grid mt-1" style={{ gridTemplateColumns: `repeat(${quarters.length}, 1fr)` }}>
            {quarters.map((q, i) => (
              <div key={i} className="text-center">
                <p className="text-[0.62rem]" style={{ color: MUTED, fontFamily: 'var(--font-mono)' }}>{fmtPeriod(q.period)}</p>
                {q.surprisePct != null && (
                  <p className="text-[0.62rem]" style={{ color: resultColor(q.result), fontFamily: 'var(--font-mono)' }}>
                    {q.surprisePct >= 0 ? '+' : ''}{(q.surprisePct * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3 flex-wrap text-[0.64rem]" style={{ color: MUTED }}>
            <span className="inline-flex items-center gap-1.5">
              <span style={{ width: 8, height: 8, borderRadius: 999, border: '1.5px solid rgba(236,231,223,0.5)', display: 'inline-block' }} /> Estimate
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span style={{ width: 8, height: 8, borderRadius: 999, background: POS, display: 'inline-block' }} /> <TooltipTerm term="Earnings beat">Beat</TooltipTerm>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span style={{ width: 8, height: 8, borderRadius: 999, background: NEG, display: 'inline-block' }} /> <TooltipTerm term="Earnings miss">Miss</TooltipTerm>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span style={{ width: 8, height: 8, borderRadius: 999, background: CAUT, display: 'inline-block' }} /> Match
            </span>
          </div>
        </>
      )}
    </RailCard>
  )
}

// ---------------------------------------------------------------------------
// Rail
// ---------------------------------------------------------------------------

export function IntelligenceRail({ data }: { data: RatingResponse }) {
  const thesis = data.investmentThesis
  const moat = data.economicMoat
  const vc = data.valuationContext
  const cat = data.catalysts

  // Key risks: thesis bear case + catalyst risks, deduped, top 4.
  const risks = Array.from(new Set([...(thesis?.bearCase || []), ...(cat?.risks || [])])).slice(0, 4)

  const moatColor = moat
    ? (moat.level.toLowerCase().includes('strong') ? POS : moat.level.toLowerCase() === 'moderate' ? CAUT : moat.level.toLowerCase() === 'weak' ? NEG : SUB)
    : SUB
  const valColor = vc
    ? (vc.status.toLowerCase().includes('underval') ? POS : vc.status.toLowerCase().includes('fairly') ? CAUT : vc.status.toLowerCase().includes('cannot') ? SUB : NEG)
    : SUB

  return (
    <div className="space-y-4">
      {thesis && (
        <RailCard title="Investment Thesis" term="Investment Thesis">
          <span className="inline-block px-2.5 py-1 rounded-full mb-2.5 text-[0.66rem] font-semibold tracking-[0.08em] uppercase" style={{ background: 'rgba(236,231,223,0.9)', color: '#16160F' }}>
            {thesis.label}
          </span>
          {thesis.summary && (
            <p className="text-sm leading-relaxed mb-3" style={{ color: INK, fontWeight: 500 }}>
              {cleanText(thesis.summary)}
            </p>
          )}
          <div className="space-y-3">
            <div>
              <p className="text-[0.62rem] tracking-[0.14em] uppercase mb-1.5" style={{ color: POS }}>
                <TooltipTerm term="Bullish case">Bull case</TooltipTerm>
              </p>
              <Bullets items={thesis.bullCase} color={POS} mark="+" />
            </div>
            <div>
              <p className="text-[0.62rem] tracking-[0.14em] uppercase mb-1.5" style={{ color: NEG }}>
                <TooltipTerm term="Bearish case">Bear case</TooltipTerm>
              </p>
              <Bullets items={thesis.bearCase} color={NEG} mark="–" />
            </div>
          </div>
          <MoreList label="What needs to be true" items={thesis.whatNeedsToBeTrue} />
          <MoreList label="What could break the thesis" items={thesis.whatCouldBreak} />
        </RailCard>
      )}

      {moat && (
        <RailCard title="Economic Moat" term="Economic moat">
          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            <Chip text={`${moat.level} moat`} color={moatColor} />
            {moat.sources.map(s => (
              <span key={s} className="text-[0.66rem] px-2 py-0.5 rounded" style={{ background: 'rgba(236,231,223,0.06)', color: SUB }}>
                <TooltipTerm term={s}>{s}</TooltipTerm>
              </span>
            ))}
          </div>
          <p className="text-xs leading-relaxed" style={{ color: SUB }}>{cleanText(moat.explanation)}</p>
          {moat.risk && (
            <p className="text-[0.68rem] leading-relaxed mt-2.5" style={{ color: MUTED }}>
              <span style={{ color: NEG, fontWeight: 600 }}>Moat risk. </span>{cleanText(moat.risk)}
            </p>
          )}
        </RailCard>
      )}

      {vc && (
        <RailCard title="Valuation Summary" term="Valuation">
          <div className="mb-2.5"><Chip text={vc.status} color={valColor} /></div>
          <p className="text-xs leading-relaxed" style={{ color: SUB }}>{cleanText(vc.multipleRead)}</p>
          <p className="text-[0.66rem] mt-2.5" style={{ color: 'var(--faint)' }}>
            Full fair value model and assumptions in Valuation Context below.
          </p>
        </RailCard>
      )}

      <AnalystConsensusCard data={data} />
      <EarningsHistoryCard data={data} />

      {cat && (
        <RailCard title="Key Catalysts" term="Catalyst">
          <Bullets items={cat.nearTerm} color={GOLD} mark="›" max={4} />
          <MoreList label="What investors may watch" items={cat.whatToWatch} />
        </RailCard>
      )}

      {risks.length > 0 && (
        <RailCard title="Key Risks">
          <Bullets items={risks} color={NEG} mark="–" max={4} />
        </RailCard>
      )}
    </div>
  )
}
