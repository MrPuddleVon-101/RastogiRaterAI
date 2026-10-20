'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { Activity, FileText, Phone, Newspaper, MessagesSquare, LineChart, ArrowUpRight, Search, Radar, Layers, Combine, Trophy } from 'lucide-react'
import { MagneticButton } from './MagneticButton'
import { scrollToTop } from './LandingSmoothScroll'

// THE SYSTEM — the flagship scene. The market globe hangs centered as an ambient
// backdrop (dimmed, slowly turning, leaning toward the cursor over a depth-dust
// field) while each act steps forward as a bold, centered "chapter poster": a
// cinematic still from the research world with the act's headline and one line
// of copy on a readable scrim, plus a clear pill meter above it. One centered
// block per act, so nothing overlaps.
//
// Four scroll acts: SCAN -> READ -> COMPRESS -> OWN IT.
// Desktop only; mobile and reduced motion get a composed stacked story.

const TacticalGlobe = dynamic(() => import('./TacticalGlobe'), { ssr: false })

const EMER = '#5FBF8A'
const PICS = '/LandingPagePics'

// Streams the "read" step ingests — shown as chips in the mobile fallback.
const STREAMS = [
  { label: 'Prices & volume', Icon: Activity },
  { label: 'SEC filings', Icon: FileText },
  { label: 'Earnings calls', Icon: Phone },
  { label: 'News flow', Icon: Newspaper },
  { label: 'Sentiment', Icon: MessagesSquare },
  { label: 'Analyst revisions', Icon: LineChart },
]

interface Act {
  n: string
  k: string
  Icon: typeof Radar
  title: string
  body: string
  img: string
  /** background-position for the still */
  pos: string
}

const ACTS: Act[] = [
  {
    n: '01', k: 'Scan', Icon: Radar,
    title: 'It watches the whole market.',
    body: 'Every US-listed name, every session. The system never has a favorite and never gets tired.',
    img: `${PICS}/11.png`, pos: 'center 18%',
  },
  {
    n: '02', k: 'Read', Icon: Layers,
    title: 'It reads everything with a number in it.',
    body: 'Filings, calls, prices, news, sentiment, revisions. Six streams, pulled into one core.',
    img: `${PICS}/8.jpg`, pos: 'center 82%',
  },
  {
    n: '03', k: 'Compress', Icon: Combine,
    title: 'Everything becomes one honest score.',
    body: 'Five weighted factors, pressure-tested against risks and catalysts. No vibes, no black box.',
    img: `${PICS}/9.png`, pos: 'center 22%',
  },
  {
    n: '04', k: 'Own it', Icon: Trophy,
    title: 'You leave with a thesis.',
    body: 'A score, a bias, and the receipts behind both. Enough to decide like you mean it.',
    img: `${PICS}/3.png`, pos: 'center 12%',
  },
]

// Each act owns a slice of the scroll track: fade in, hold, fade out (the last
// one just fades in and holds).
const ACT_WINDOWS: [number, number, number, number][] = [
  [0.0, 0.06, 0.2, 0.25],
  [0.28, 0.34, 0.46, 0.51],
  [0.54, 0.6, 0.68, 0.73],
  [0.78, 0.84, 1, 1],
]

export function SystemScene() {
  const [wide, setWide] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => setWide(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  if (!wide || reduced) return <StackedSystem />
  return <PinnedSystem />
}

/* ------------------------------- pinned scene ------------------------------- */

// Deterministic pseudo-random for the dust field (stable across SSR/CSR).
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function PinnedSystem() {
  const trackRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })
  const q = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.5 })

  // Which act is live — gates pointer events on the (otherwise stacked) chapters.
  const [active, setActive] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', v => {
    setActive(Math.max(0, Math.min(ACTS.length - 1, Math.floor(v / (1 / ACTS.length) + 0.0001))))
  })

  // Ambient globe: turns slowly, breathes with scroll.
  const globeScale = useTransform(q, [0, 0.5, 1], [1.02, 1.12, 1.02])
  const ringSpin = useTransform(q, [0, 1], [0, 90])

  // The stage leans toward the cursor so the backdrop reads as a volume.
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), { stiffness: 60, damping: 18 })
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [5, -5]), { stiffness: 60, damping: 18 })
  const dustFarX = useSpring(useTransform(mx, [-0.5, 0.5], [10, -10]), { stiffness: 55, damping: 20 })
  const dustFarY = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 55, damping: 20 })
  // the chapter poster drifts a touch opposite the globe: foreground parallax
  const cardX = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), { stiffness: 70, damping: 20 })
  const cardY = useSpring(useTransform(my, [-0.5, 0.5], [-6, 6]), { stiffness: 70, damping: 20 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      mx.set(e.clientX / window.innerWidth - 0.5)
      my.set(e.clientY / window.innerHeight - 0.5)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [mx, my])

  const dust = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    x: rand(i) * 100, y: rand(i + 50) * 100,
    s: 1 + rand(i + 100) * 1.8, o: 0.1 + rand(i + 150) * 0.28, d: rand(i + 200) * 6,
  })), [])

  // Was 440vh: four and a half screens pinned to one scene, which is most of
  // why the middle of the page felt like nothing was happening. The internal
  // keyframes are normalised to scroll progress, so shortening the track just
  // tightens the pacing.
  return (
    <section ref={trackRef} className="relative" style={{ height: '250vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* deep-space atmosphere */}
        <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(64% 60% at 50% 50%, rgba(46,148,102,0.12), transparent 66%)' }} />
        <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(95,191,138,0.25), transparent)' }} />

        {/* depth dust, drifting with the cursor */}
        <motion.div aria-hidden className="absolute inset-[-3%]" style={{ x: dustFarX, y: dustFarY, zIndex: 1 }}>
          {dust.map((p, i) => (
            <span key={i} className="sys-dust absolute rounded-full" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, background: 'rgba(200,230,214,0.9)', opacity: p.o, animationDelay: `${p.d}s` }} />
          ))}
        </motion.div>

        {/* AMBIENT BACKDROP: the market globe, centered, dimmed, leaning */}
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: 'min(78vh, 820px)', height: 'min(78vh, 820px)', zIndex: 2,
            opacity: 0.5, rotateX: rotX, rotateY: rotY, transformPerspective: 1200,
          }}
        >
          <div className="absolute rounded-full" style={{ inset: '14%', background: 'radial-gradient(circle, rgba(46,148,102,0.22) 0%, rgba(46,148,102,0.06) 48%, transparent 70%)', filter: 'blur(16px)' }} />
          {/* tilted orbit ring: squash outer, spin inner (no precession) */}
          <div className="absolute inset-0" style={{ transform: 'scaleY(0.44)' }}>
            <motion.div className="absolute inset-0 rounded-full" style={{ rotate: ringSpin, border: '1px dashed rgba(95,191,138,0.2)' }} />
          </div>
          <motion.div className="absolute" style={{ inset: '12%', scale: globeScale }}>
            <TacticalGlobe />
          </motion.div>
        </motion.div>

        {/* readability veil so the globe never fights the poster */}
        <div aria-hidden className="absolute inset-0" style={{ zIndex: 3, background: 'radial-gradient(46% 46% at 50% 52%, rgba(6,7,9,0.72) 0%, rgba(6,7,9,0.35) 55%, transparent 78%)' }} />

        {/* FOREGROUND: meter + centered chapter poster */}
        <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-6" style={{ zIndex: 20, x: cardX, y: cardY }}>
          <ActMeter q={q} />
          <div className="relative w-full mt-6" style={{ maxWidth: 640, height: 'min(56vh, 484px)' }}>
            {ACTS.map((a, i) => <ActChapter key={a.n} act={a} i={i} q={q} active={active === i} />)}
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        :global(.sys-dust) { animation: sys-twinkle 7s ease-in-out infinite; }
        @keyframes sys-twinkle {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(-7px); opacity: 0.55; }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.sys-dust) { animation: none; }
        }
      `}</style>
    </section>
  )
}

// The pill meter: four labeled steps, the active one burns emerald.
function ActMeter({ q }: { q: MotionValue<number> }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 rounded-full px-2 py-2" style={{ background: 'rgba(9,10,13,0.6)', border: '1px solid var(--border-2)', backdropFilter: 'blur(10px)', boxShadow: '0 12px 34px rgba(0,0,0,0.5)' }}>
      {ACTS.map((a, i) => <MeterPill key={a.n} act={a} i={i} q={q} />)}
    </div>
  )
}

function MeterPill({ act, i, q }: { act: Act; i: number; q: MotionValue<number> }) {
  const [a, b, c, d] = ACT_WINDOWS[i]
  const last = i === ACTS.length - 1
  const on = useTransform(q, last ? [a, b] : [a, b, c, d], last ? [0, 1] : [0, 1, 1, 0])
  const bg = useTransform(on, [0, 1], ['rgba(255,255,255,0)', 'rgba(46,148,102,0.9)'])
  const color = useTransform(on, [0, 1], ['rgba(120,124,134,1)', '#06140D'])
  const iconColor = useTransform(on, [0, 1], ['rgba(120,124,134,1)', '#06140D'])
  const shadow = useTransform(on, [0, 1], ['0 0 0 rgba(0,0,0,0)', '0 6px 18px rgba(46,148,102,0.45)'])
  return (
    <motion.span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3.5 py-1.5"
      style={{ background: bg, color, boxShadow: shadow }}
    >
      <motion.span style={{ color: iconColor, display: 'inline-flex' }}><act.Icon size={13} strokeWidth={2.4} /></motion.span>
      <span className="text-[0.62rem] sm:text-[0.7rem] font-bold uppercase" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
        <span className="hidden sm:inline">{act.n} </span>{act.k}
      </span>
    </motion.span>
  )
}

// A centered chapter poster: cinematic still + emerald frame, big bold headline
// and one line of copy on a readable bottom scrim.
function ActChapter({ act, i, q, active }: { act: Act; i: number; q: MotionValue<number>; active: boolean }) {
  const [a, b, c, d] = ACT_WINDOWS[i]
  const last = i === ACTS.length - 1
  const opacity = useTransform(q, last ? [a, b] : [a, b, c, d], last ? [0, 1] : [0, 1, 1, 0])
  const y = useTransform(q, last ? [a, b] : [a, b, c, d], last ? [46, 0] : [46, 0, 0, -34])
  const scale = useTransform(q, last ? [a, b] : [a, b, c, d], last ? [0.93, 1] : [0.93, 1, 1, 0.97])
  // the still pushes in slightly as the act holds — a slow living zoom
  const imgScale = useTransform(q, last ? [a, b] : [a, d], [1.12, 1])

  return (
    <motion.div
      className="absolute inset-0"
      style={{ opacity, y, scale, pointerEvents: active ? 'auto' : 'none' }}
    >
      <div
        className="relative w-full h-full overflow-hidden rounded-[26px]"
        style={{
          border: '1px solid rgba(63,176,124,0.35)',
          boxShadow: '0 50px 130px rgba(0,0,0,0.7), 0 0 60px rgba(46,148,102,0.16)',
        }}
      >
        {/* the still */}
        <motion.div
          aria-hidden
          className="absolute inset-0"
          style={{ backgroundImage: `url(${act.img})`, backgroundSize: 'cover', backgroundPosition: act.pos, filter: 'grayscale(0.35) contrast(1.06) brightness(0.82)', scale: imgScale }}
        />
        {/* scrim: keep the top airy, anchor the copy in a legible base */}
        <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,7,9,0.15) 0%, rgba(7,7,9,0.1) 34%, rgba(7,7,9,0.82) 74%, rgba(7,7,9,0.97) 100%)' }} />
        <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(90% 70% at 12% 0%, rgba(46,148,102,0.16), transparent 55%)' }} />
        {/* emerald top edge */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${EMER}, transparent)`, opacity: 0.7 }} />

        {/* number chip, top-left */}
        <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: 'rgba(9,10,13,0.62)', border: '1px solid rgba(95,191,138,0.35)', backdropFilter: 'blur(8px)' }}>
          <act.Icon size={13} strokeWidth={2.4} style={{ color: EMER }} />
          <span className="text-[0.62rem] font-bold uppercase" style={{ color: '#A9E0C4', fontFamily: 'var(--font-mono)', letterSpacing: '0.16em' }}>{act.n} · {act.k}</span>
        </div>

        {/* copy, centered on the base */}
        <div className="absolute inset-x-0 bottom-0 px-6 sm:px-9 pb-7 sm:pb-9 text-center">
          <h3
            className="mx-auto font-semibold"
            style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.8rem)', lineHeight: 1.06, letterSpacing: '-0.035em', color: 'var(--text)', maxWidth: '18ch', textWrap: 'balance', textShadow: '0 2px 26px rgba(0,0,0,0.8)' }}
          >
            {act.title}
          </h3>
          <p className="mx-auto mt-3" style={{ color: 'rgba(226,224,218,0.92)', fontSize: 'clamp(0.98rem, 1.35vw, 1.12rem)', lineHeight: 1.55, maxWidth: '46ch', textShadow: '0 2px 16px rgba(0,0,0,0.85)' }}>
            {act.body}
          </p>
          {last && (
            <MagneticButton
              onClick={() => scrollToTop()}
              ariaLabel="Run your first ticker"
              className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              style={{ background: 'linear-gradient(180deg, #3FB07C 0%, #2E9466 100%)', color: '#06140D', boxShadow: '0 10px 30px rgba(46,148,102,0.4)' }}
            >
              <Search size={15} strokeWidth={2.5} />
              Run your first ticker
              <ArrowUpRight size={16} strokeWidth={2.5} />
            </MagneticButton>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* --------------------- mobile / reduced-motion fallback --------------------- */

function StackedSystem() {
  const reduced = useReducedMotion()
  return (
    <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="t-section" style={{ color: 'var(--text)' }}>
          The system behind <span style={{ color: EMER }}>every score.</span>
        </h2>
      </motion.div>

      <div className="mt-8 space-y-5">
        {ACTS.map((act, i) => (
          <motion.div
            key={act.n}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: i * 0.04 }}
            className="relative overflow-hidden rounded-2xl"
            style={{ border: '1px solid rgba(63,176,124,0.28)', minHeight: 300 }}
          >
            <div aria-hidden className="absolute inset-0" style={{ backgroundImage: `url(${act.img})`, backgroundSize: 'cover', backgroundPosition: act.pos, filter: 'grayscale(0.35) contrast(1.06) brightness(0.8)' }} />
            <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,7,9,0.2) 0%, rgba(7,7,9,0.55) 50%, rgba(7,7,9,0.96) 100%)' }} />
            <div className="relative p-6 flex flex-col justify-end" style={{ minHeight: 300 }}>
              <div className="inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 mb-3" style={{ background: 'rgba(9,10,13,0.6)', border: '1px solid rgba(95,191,138,0.35)' }}>
                <act.Icon size={13} strokeWidth={2.4} style={{ color: EMER }} />
                <span className="text-[0.62rem] font-bold uppercase" style={{ color: '#A9E0C4', fontFamily: 'var(--font-mono)', letterSpacing: '0.14em' }}>{act.n} · {act.k}</span>
              </div>
              <h3 className="t-sub" style={{ color: 'var(--text)', textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>{act.title}</h3>
              <p className="mt-2.5 max-w-md" style={{ color: 'rgba(226,224,218,0.92)', fontSize: '0.98rem', lineHeight: 1.55, textShadow: '0 2px 14px rgba(0,0,0,0.85)' }}>{act.body}</p>
              {i === 1 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {STREAMS.map(s => (
                    <span key={s.label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.66rem]" style={{ background: 'rgba(46,148,102,0.14)', border: '1px solid rgba(63,176,124,0.3)', color: '#A9E0C4' }}>
                      <s.Icon size={11} style={{ color: EMER }} />
                      {s.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <MagneticButton
          onClick={() => scrollToTop()}
          ariaLabel="Run your first ticker"
          className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
          style={{ background: 'linear-gradient(180deg, #3FB07C 0%, #2E9466 100%)', color: '#06140D', boxShadow: '0 10px 30px rgba(46,148,102,0.4)' }}
        >
          <Search size={15} strokeWidth={2.5} />
          Run your first ticker
        </MagneticButton>
      </div>
    </section>
  )
}
