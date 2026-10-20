'use client'
import { useEffect } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { RatingResponse } from '@/lib/types'
import { formatPrice } from '@/lib/utils'

/**
 * The answer, on its own, before anything else.
 *
 * A reader arrives with one question: should I own this? Previously they got
 * a chart, a score anatomy, a valuation model and 23 metric rows before any
 * plain statement of the conclusion. This says it in about sixty words:
 * the number, what it means, the one-line take, and the three things that
 * actually move the decision. Everything else is a layer they can choose to
 * open underneath.
 */

function toneFor(score: number) {
  if (score >= 70) return { ink: 'var(--pos)', glow: 'var(--pos-glow)', bg: 'var(--pos-bg)' }
  if (score >= 55) return { ink: 'var(--caut)', glow: 'var(--caut-glow)', bg: 'var(--caut-bg)' }
  return { ink: 'var(--neg)', glow: 'var(--neg-glow)', bg: 'var(--neg-bg)' }
}

function Dial({ score, ink, glow }: { score: number; ink: string; glow: string }) {
  const reduced = useReducedMotion()
  const R = 76
  const C = 2 * Math.PI * R
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { stiffness: 52, damping: 19, mass: 0.9 })
  const dash = useTransform(spring, v => C - (C * v) / 100)
  const shown = useTransform(spring, v => Math.round(v))

  useEffect(() => {
    if (reduced) { mv.jump(score); return }
    mv.set(score)
  }, [score, reduced, mv])

  return (
    <div className="relative shrink-0" style={{ width: 180, height: 180 }}>
      {/* the score lights its own surroundings: this is the depth cue */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 68%)`, filter: 'blur(16px)' }}
      />
      <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)', position: 'relative' }}>
        <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="11" />
        <motion.circle
          cx="90" cy="90" r={R} fill="none"
          stroke={ink} strokeWidth="11" strokeLinecap="round"
          strokeDasharray={C}
          style={{ strokeDashoffset: dash, filter: `drop-shadow(0 0 10px ${glow})` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <motion.span
          className="t-num"
          style={{ fontSize: '3.6rem', fontWeight: 500, color: 'var(--text)', lineHeight: 1 }}
        >
          {shown}
        </motion.span>
        <span className="t-label absolute" style={{ bottom: 40, fontSize: '0.6rem' }}>OUT OF 100</span>
      </div>
    </div>
  )
}

function Pillar({
  label, text, ink, i,
}: { label: string; text: string; ink: string; i: number }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-xl px-4 py-3.5"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018))',
        border: '1px solid var(--border-2)',
        boxShadow: 'var(--raise-1)',
      }}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[2px]"
        style={{ background: ink, boxShadow: `0 0 12px ${ink}` }}
      />
      <p className="t-label" style={{ color: ink, letterSpacing: '0.08em' }}>{label}</p>
      <p className="mt-1.5" style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.55 }}>{text}</p>
    </motion.div>
  )
}

export function Verdict({ data }: { data: RatingResponse }) {
  const reduced = useReducedMotion()
  const tone = toneFor(data.overallScore)
  // Not every company returns a takeaway of each type -- a strong name often
  // has no `negative` one -- and a missing pillar silently drops a third of
  // the answer. Fall back to the drivers / drags / neutral lists, which are
  // always populated, so the reader always gets all three sides.
  const t = data.takeaways ?? []
  const best = t.find(x => x.type === 'positive')?.text ?? data.drivers?.[0]
  const risk =
    t.find(x => x.type === 'negative')?.text ??
    data.drags?.[0] ??
    data.categoryScores?.slice().sort((a, b) => a.score / a.maxScore - b.score / b.maxScore)[0]?.reason
  const watch =
    t.find(x => x.type !== 'positive' && x.type !== 'negative')?.text ??
    data.neutral?.[0] ??
    data.chartRead?.summary
  const bias = data.longTermThesisBias

  return (
    <section className="relative">
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl"
        style={{
          background: 'linear-gradient(165deg, var(--surface-2) 0%, var(--bg-2) 100%)',
          border: '1px solid var(--border-3)',
          boxShadow: 'var(--raise-3)',
        }}
      >
        {/* tinted wash keyed to the verdict, so a strong and a weak company
            do not arrive looking identical */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(90% 70% at 18% 0%, ${tone.bg} 0%, transparent 62%)` }}
        />

        <div className="relative px-6 py-7 sm:px-9 sm:py-9">
          {/* identity */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
            <div className="min-w-0">
              <h1
                style={{
                  fontFamily: 'var(--font-display), Georgia, serif',
                  fontSize: 'clamp(1.7rem, 3vw, 2.5rem)',
                  fontWeight: 500,
                  letterSpacing: '-0.015em',
                  color: 'var(--text)',
                  lineHeight: 1.1,
                }}
              >
                {data.companyName}
              </h1>
              <p className="t-label mt-1">
                {data.ticker}{data.sector ? ` · ${data.sector}` : ''}
              </p>
            </div>
            {data.currentPrice != null && (
              <p className="t-num" style={{ fontSize: '1.5rem', color: 'var(--text)' }}>
                {formatPrice(data.currentPrice, data.currency)}
              </p>
            )}
          </div>

          {/* the answer */}
          <div className="mt-7 flex flex-col items-start gap-7 sm:flex-row sm:items-center sm:gap-9">
            <Dial score={data.overallScore} ink={tone.ink} glow={tone.glow} />

            <div className="min-w-0 flex-1">
              <p
                style={{
                  fontSize: 'clamp(1.35rem, 2.4vw, 1.9rem)',
                  fontWeight: 600,
                  color: tone.ink,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                }}
              >
                {data.ratingLabel}
              </p>
              <p
                className="mt-2"
                style={{ fontSize: '1.05rem', color: 'var(--text)', lineHeight: 1.5, maxWidth: '34ch' }}
              >
                {data.oneLineVerdict}
              </p>
              {bias && (
                <p className="mt-3.5 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                   style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid var(--border-2)' }}>
                  <span className="t-label" style={{ letterSpacing: '0.08em' }}>LONG TERM</span>
                  <span style={{ fontSize: '0.86rem', color: 'var(--text)', fontWeight: 500 }}>{bias.label}</span>
                </p>
              )}
            </div>
          </div>

          {/* the three things that move the decision */}
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {best && <Pillar i={0} label="STRONGEST ARGUMENT" text={best} ink="var(--pos)" />}
            {risk && <Pillar i={1} label="BIGGEST RISK" text={risk} ink="var(--neg)" />}
            {watch && <Pillar i={2} label="WHAT TO WATCH" text={watch} ink="var(--caut)" />}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
