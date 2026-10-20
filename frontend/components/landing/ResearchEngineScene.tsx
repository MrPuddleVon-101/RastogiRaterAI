'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { FileText, Phone, Activity, Newspaper, UserRound, LineChart, Landmark, Flame, MessageCircleWarning, Megaphone, CheckCheck } from 'lucide-react'

// The Stonky Research Engine as a machine you scroll through, not a dashboard.
// A pinned cinematic panel with three zones: raw SOURCES drift on the left,
// travel into a luminous FILTER gate in the center, and come out the other side
// as compressed EVIDENCE that assembles a thesis card. Weak signals (hype,
// rumor, hot tips) visibly deflect off the gate and fall away. Everything is
// scroll-linked (transform/opacity only) with a soft spring for cinematic lag,
// plus quiet idle motion so the machine never looks frozen.
//
// Desktop: pinned ~260vh. Mobile / reduced motion: a composed static story.

const EMER = '#5FBF8A'
const RUST = '#D98A6A'

interface SourceChip {
  label: string
  Icon: typeof FileText
  strong: boolean
  /** resting position, % of panel */
  x: number
  y: number
  /** where it meets the gate, % of panel height */
  gateY: number
  /** travel window start on the 0..1 scroll track */
  t: number
}

// Six real sources that pass the gate, four that don't. Positions hand-placed
// so the left cloud reads loose and organic, never a grid.
const CHIPS: SourceChip[] = [
  { label: '10-K filings', Icon: FileText, strong: true, x: 6, y: 22, gateY: 30, t: 0.02 },
  { label: 'Earnings calls', Icon: Phone, strong: true, x: 20, y: 12, gateY: 38, t: 0.07 },
  { label: 'Price tape', Icon: Activity, strong: true, x: 11, y: 44, gateY: 46, t: 0.12 },
  { label: 'News wire', Icon: Newspaper, strong: true, x: 25, y: 34, gateY: 54, t: 0.17 },
  { label: 'Analyst revisions', Icon: LineChart, strong: true, x: 8, y: 64, gateY: 62, t: 0.22 },
  { label: 'Balance sheets', Icon: Landmark, strong: true, x: 22, y: 56, gateY: 70, t: 0.27 },
  { label: 'Reddit hype', Icon: Flame, strong: false, x: 15, y: 78, gateY: 76, t: 0.10 },
  { label: 'Hot tips', Icon: MessageCircleWarning, strong: false, x: 28, y: 70, gateY: 60, t: 0.18 },
  { label: 'Rumor mill', Icon: Megaphone, strong: false, x: 5, y: 86, gateY: 50, t: 0.24 },
  { label: 'Influencer takes', Icon: UserRound, strong: false, x: 26, y: 88, gateY: 42, t: 0.30 },
]

// What the strong sources compress into: the receipts.
const EVIDENCE = [
  { k: 'Profitability', v: '31% ROIC, top-decile margins' },
  { k: 'Balance sheet', v: 'Net cash. No leverage risk' },
  { k: 'Valuation', v: '28× earnings vs 34× five-year avg' },
  { k: 'Momentum', v: 'Estimates revised up for 90 days' },
  { k: 'Street view', v: 'Targets rising, spread narrowing' },
  { k: 'Risk', v: 'Priced for perfection near highs' },
]

const GATE_X = 44 // % of panel width where the gate lives

export function ResearchEngineScene() {
  const [wide, setWide] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => setWide(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  if (!wide || reduced) return <StackedEngine />
  return <PinnedEngine />
}

/* ------------------------------ pinned scene ------------------------------ */

function PinnedEngine() {
  const trackRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })
  // Soft lag for the moving parts; raw progress for the progress hairline.
  const q = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.5 })

  // The heading hands off to the machine: fades slightly as evidence builds.
  const headO = useTransform(q, [0, 0.08, 0.85, 1], [0, 1, 1, 0.9])

  // The machine is an object in space: it enters tipped away from the reader,
  // levels out while it runs, and tips back as the scene releases.
  const machineTilt = useTransform(q, [0, 0.16, 0.85, 1], [11, 0, 0, -5])
  const machineScale = useTransform(q, [0, 0.16], [0.955, 1])

  // 260vh of pinned track held the reader on this one scene for over two and a
  // half screens. 190vh keeps the beat without the dead drag. The sticky child
  // is padded so the scene centres BELOW the floating navbar, which the heading
  // used to slide underneath.
  return (
    <section ref={trackRef} className="relative" style={{ height: '190vh' }}>
      <div className="sticky top-0 h-screen flex items-center pt-24 pb-8">
        <div className="w-full max-w-6xl mx-auto px-6">
          <motion.div style={{ opacity: headO }} className="mb-5 flex items-end justify-between gap-6">
            <div>
              <h2 className="t-section" style={{ color: 'var(--text)' }}>
                Evidence in. <span style={{ color: EMER }}>Conviction out.</span>
              </h2>
              <p className="t-lead mt-3">
                The engine reads what the market prints, keeps what survives scrutiny, and throws the rest away.
              </p>
            </div>
            <span className="hidden md:block shrink-0 text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
              8,000+ TICKERS · 7 SIGNALS · ~5s
            </span>
          </motion.div>

          {/* the machine */}
          <motion.div
            className="relative overflow-hidden rounded-[26px]"
            style={{
              height: 'min(60vh, 560px)',
              rotateX: machineTilt,
              scale: machineScale,
              transformPerspective: 1300,
              transformOrigin: '50% 100%',
              border: '1px solid var(--border-2)',
              background: 'linear-gradient(180deg, rgba(16,18,23,0.92), rgba(9,10,13,0.97))',
              boxShadow: '0 50px 120px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* faint drifting grid, masked to the intake side: raw territory */}
            <div
              aria-hidden
              className="absolute inset-0 re-drift"
              style={{
                backgroundImage: 'linear-gradient(rgba(115,128,130,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(115,128,130,0.09) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                maskImage: `linear-gradient(90deg, #000 0%, #000 ${GATE_X - 6}%, transparent ${GATE_X + 8}%)`,
                WebkitMaskImage: `linear-gradient(90deg, #000 0%, #000 ${GATE_X - 6}%, transparent ${GATE_X + 8}%)`,
              }}
            />
            {/* calm emerald atmosphere on the thesis side */}
            <div aria-hidden className="absolute inset-0" style={{ background: `radial-gradient(70% 90% at 88% 30%, rgba(46,148,102,0.10), transparent 60%)` }} />

            {/* zone labels: this IS a left-to-right sequence, so the labels are earned */}
            <div aria-hidden className="absolute top-4 inset-x-0 flex text-[0.6rem]" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.2em', color: 'var(--muted)' }}>
              <span className="absolute" style={{ left: '5%' }}>RAW SOURCES</span>
              <span className="absolute -translate-x-1/2" style={{ left: `${GATE_X}%`, color: EMER }}>THE FILTER</span>
              <span className="absolute" style={{ right: '5%' }}>THE THESIS</span>
            </div>

            {/* the gate */}
            <Gate q={q} />

            {/* source chips */}
            {CHIPS.map(c => <Chip key={c.label} chip={c} q={q} />)}

            {/* evidence stack + thesis card, right zone */}
            <div className="absolute" style={{ left: `${GATE_X + 9}%`, right: '4.5%', top: '12%', bottom: '10%' }}>
              <div className="flex h-full items-stretch gap-5">
                <div className="flex flex-col justify-center gap-2 min-w-0" style={{ flex: '1 1 52%' }}>
                  {EVIDENCE.map((e, i) => <EvidenceRow key={e.k} k={e.k} v={e.v} i={i} q={q} />)}
                </div>
                <ThesisCard q={q} />
              </div>
            </div>

            {/* run progress hairline */}
            <motion.div aria-hidden className="absolute bottom-0 left-0 right-0 h-[3px] origin-left" style={{ scaleX: scrollYProgress, background: `linear-gradient(90deg, #2E7B54, ${EMER})` }} />
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .re-drift {
          animation: re-drift 10s linear infinite;
        }
        @keyframes re-drift {
          from { background-position: 0 0; }
          to { background-position: 40px 40px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .re-drift { animation: none; }
        }
      `}</style>
    </section>
  )
}

// The luminous vertical filter slit with a travelling scanline.
function Gate({ q }: { q: MotionValue<number> }) {
  const glow = useTransform(q, [0, 0.15, 0.6, 1], [0.5, 1, 1, 0.7])
  return (
    <motion.div aria-hidden className="absolute -translate-x-1/2" style={{ left: `${GATE_X}%`, top: '10%', bottom: '10%', width: 46, opacity: glow }}>
      {/* halo */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full rounded-full" style={{ background: `radial-gradient(50% 60% at 50% 50%, rgba(46,148,102,0.28), transparent 70%)`, filter: 'blur(8px)' }} />
      {/* the slit */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] rounded-full" style={{ background: `linear-gradient(180deg, transparent, ${EMER} 18%, ${EMER} 82%, transparent)`, boxShadow: `0 0 22px rgba(95,191,138,0.55)` }} />
      {/* travelling scan pulse */}
      <motion.span
        className="absolute left-1/2 -translate-x-1/2 w-[7px] h-16 rounded-full"
        style={{ background: `linear-gradient(180deg, transparent, rgba(159,255,203,0.95), transparent)`, filter: 'blur(1px)' }}
        animate={{ top: ['0%', '78%', '0%'] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* gate ticks */}
      {[20, 40, 60, 80].map(y => (
        <span key={y} className="absolute left-1/2 -translate-x-1/2 h-px w-4" style={{ top: `${y}%`, background: 'rgba(95,191,138,0.4)' }} />
      ))}
    </motion.div>
  )
}

// One source chip travelling from its resting cloud into the gate. Strong
// sources flash through; weak ones deflect and fall out of the machine.
function Chip({ chip, q }: { chip: SourceChip; q: MotionValue<number> }) {
  const t0 = chip.t
  const t1 = chip.t + 0.3 // reaches the gate
  const t2 = t1 + 0.12 // resolution complete

  // Hook calls stay unconditional (rules of hooks); strong/weak only changes
  // the stop arrays. Strong chips vanish INTO the gate; weak ones fall past it.
  const x = useTransform(q, [t0, t1], [`${chip.x}%`, `${GATE_X - 1.5}%`])
  const y = useTransform(
    q,
    chip.strong ? [t0, t1] : [t0, t1, t2],
    chip.strong ? [`${chip.y}%`, `${chip.gateY}%`] : [`${chip.y}%`, `${chip.gateY}%`, `${chip.gateY + 26}%`],
  )
  const rotate = useTransform(q, [t1, t2], chip.strong ? [0, 0] : [0, chip.x % 2 ? 24 : -18])
  const opacity = useTransform(
    q,
    chip.strong ? [t0 - 0.02, t0, t1, t1 + 0.04] : [t0 - 0.02, t0, t1, t2],
    [0.9, 1, 1, 0],
  )
  const scale = useTransform(q, [t0, t1], [1, 0.92])

  const tone = chip.strong ? 'var(--text-2)' : RUST
  return (
    <motion.div className="absolute z-10" style={{ left: x, top: y, opacity, rotate, scale }}>
      {/* idle float lives on an inner element so it never fights scroll transforms */}
      <span
        className="re-float inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.7rem] whitespace-nowrap"
        style={{
          background: chip.strong ? 'rgba(21,23,29,0.85)' : 'rgba(30,20,17,0.8)',
          border: `1px solid ${chip.strong ? 'var(--border-3)' : 'rgba(217,138,106,0.35)'}`,
          color: tone,
          boxShadow: '0 10px 26px rgba(0,0,0,0.45)',
          backdropFilter: 'blur(6px)',
          animationDelay: `${(chip.x + chip.y) % 4}s`,
        }}
      >
        <chip.Icon size={12} style={{ color: chip.strong ? EMER : RUST }} />
        {chip.label}
      </span>
      <style jsx>{`
        .re-float { animation: re-float 6s ease-in-out infinite; display: inline-flex; }
        @keyframes re-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .re-float { animation: none; }
        }
      `}</style>
    </motion.div>
  )
}

// A compressed receipt line that lights up as its source clears the gate.
function EvidenceRow({ k, v, i, q }: { k: string; v: string; i: number; q: MotionValue<number> }) {
  const t = 0.38 + i * 0.055
  const opacity = useTransform(q, [t, t + 0.06], [0, 1])
  const x = useTransform(q, [t, t + 0.06], [16, 0])
  return (
    <motion.div
      className="flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 min-w-0"
      style={{ opacity, x, background: 'rgba(13,15,18,0.7)', border: '1px solid var(--border-2)' }}
    >
      <CheckCheck size={13} className="shrink-0 mt-0.5" style={{ color: EMER }} />
      <div className="min-w-0">
        <p className="text-[0.6rem]" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>{k.toUpperCase()}</p>
        <p className="text-[0.8rem] leading-snug" style={{ color: 'var(--text)' }}>{v}</p>
      </div>
    </motion.div>
  )
}

// The output: a compact thesis dossier that assembles at the end of the run.
function ThesisCard({ q }: { q: MotionValue<number> }) {
  const opacity = useTransform(q, [0.7, 0.8], [0, 1])
  const yv = useTransform(q, [0.7, 0.8], [26, 0])
  const scale = useTransform(q, [0.7, 0.8], [0.95, 1])
  const R = 34
  const C = 2 * Math.PI * R
  const dash = useTransform(q, [0.76, 0.94], [C, C * (1 - 0.82)])
  const takeO = useTransform(q, [0.86, 0.93], [0, 1])

  return (
    <motion.div
      className="self-center shrink-0 rounded-2xl p-5"
      style={{
        opacity, y: yv, scale,
        width: 'clamp(230px, 46%, 300px)',
        background: 'radial-gradient(120% 90% at 30% 0%, rgba(46,148,102,0.16), rgba(10,11,14,0) 55%), linear-gradient(180deg, var(--surface-2), var(--surface))',
        border: '1px solid rgba(63,176,124,0.3)',
        boxShadow: '0 34px 80px rgba(0,0,0,0.55), 0 0 44px rgba(46,148,102,0.12)',
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>NVIDIA Corp</p>
          <p className="text-[0.64rem]" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>NVDA · NASDAQ</p>
        </div>
        <span className="text-[0.55rem] px-2 py-1 rounded-full" style={{ background: 'var(--pos-bg)', color: EMER, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>THESIS</span>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: 88, height: 88 }}>
          <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90 origin-center">
            <circle cx="44" cy="44" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="7" />
            <motion.circle cx="44" cy="44" r={R} fill="none" stroke={EMER} strokeWidth="7" strokeLinecap="round" strokeDasharray={C} style={{ strokeDashoffset: dash }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span style={{ fontSize: '1.55rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>82</span>
            <span className="text-[0.5rem]" style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}>/ 100</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold" style={{ color: EMER }}>Cautiously bullish</p>
          <p className="mt-1 text-[0.7rem]" style={{ color: 'var(--text-2)', lineHeight: 1.5 }}>Long-term thesis bias, receipts attached.</p>
        </div>
      </div>
      <motion.p className="mt-4 pt-3 text-[0.78rem]" style={{ opacity: takeO, borderTop: '1px solid var(--border-2)', color: 'var(--text-2)', lineHeight: 1.55 }}>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>Cold take:</span> quality compounding at a price the market has not sobered up to.
      </motion.p>
    </motion.div>
  )
}

/* --------------------- mobile / reduced-motion fallback --------------------- */

function StackedEngine() {
  const reduced = useReducedMotion()
  const fade = (d = 0) => ({
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const, delay: d },
  })

  return (
    <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
      <motion.div {...fade()}>
        <h2 className="t-section" style={{ color: 'var(--text)' }}>
          Evidence in. <span style={{ color: EMER }}>Conviction out.</span>
        </h2>
        <p className="mt-3 max-w-xl" style={{ color: 'var(--text-2)', fontSize: '1.02rem', lineHeight: 1.6 }}>
          The engine reads what the market prints, keeps what survives scrutiny, and throws the rest away.
        </p>
      </motion.div>

      {/* sources */}
      <motion.div {...fade(0.05)} className="mt-8 flex flex-wrap gap-2">
        {CHIPS.map(c => (
          <span
            key={c.label}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.72rem]"
            style={{
              background: c.strong ? 'rgba(21,23,29,0.85)' : 'rgba(30,20,17,0.8)',
              border: `1px solid ${c.strong ? 'var(--border-3)' : 'rgba(217,138,106,0.35)'}`,
              color: c.strong ? 'var(--text-2)' : RUST,
              textDecoration: c.strong ? 'none' : 'line-through',
              textDecorationColor: 'rgba(217,138,106,0.6)',
            }}
          >
            <c.Icon size={12} style={{ color: c.strong ? EMER : RUST }} />
            {c.label}
          </span>
        ))}
      </motion.div>

      {/* the filter divider */}
      <motion.div {...fade(0.1)} className="my-6 flex items-center gap-3">
        <span className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(95,191,138,0.5))' }} />
        <span className="text-[0.6rem]" style={{ color: EMER, fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}>THE FILTER</span>
        <span className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(95,191,138,0.5), transparent)' }} />
      </motion.div>

      {/* evidence + thesis */}
      <div className="grid grid-cols-1 sm:grid-cols-[1.1fr_0.9fr] gap-4 items-start">
        <motion.div {...fade(0.12)} className="space-y-2">
          {EVIDENCE.map(e => (
            <div key={e.k} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5" style={{ background: 'rgba(13,15,18,0.7)', border: '1px solid var(--border-2)' }}>
              <CheckCheck size={13} className="shrink-0" style={{ color: EMER }} />
              <span className="text-[0.66rem] w-[86px] shrink-0" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{e.k}</span>
              <span className="text-[0.8rem]" style={{ color: 'var(--text)' }}>{e.v}</span>
            </div>
          ))}
        </motion.div>
        <motion.div
          {...fade(0.18)}
          className="rounded-2xl p-5"
          style={{
            background: 'radial-gradient(120% 90% at 30% 0%, rgba(46,148,102,0.16), rgba(10,11,14,0) 55%), linear-gradient(180deg, var(--surface-2), var(--surface))',
            border: '1px solid rgba(63,176,124,0.3)',
            boxShadow: '0 34px 80px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>NVIDIA Corp</p>
              <p className="text-[0.64rem]" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>NVDA · NASDAQ</p>
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>82<span className="text-xs" style={{ color: 'var(--muted)' }}>/100</span></span>
          </div>
          <p className="mt-2 text-xs font-semibold" style={{ color: EMER }}>Cautiously bullish</p>
          <p className="mt-3 pt-3 text-[0.78rem]" style={{ borderTop: '1px solid var(--border-2)', color: 'var(--text-2)', lineHeight: 1.55 }}>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>Cold take:</span> quality compounding at a price the market has not sobered up to.
          </p>
        </motion.div>
      </div>

      <p className="mt-6 text-center text-[0.66rem]" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em' }}>
        8,000+ TICKERS · 7 SIGNALS PER NAME · ~5s TO A FULL READ
      </p>
    </section>
  )
}
