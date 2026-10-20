'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion, type TargetAndTransition } from 'motion/react'

// Ticky: the Ask Ticky guide, animated with his real image frames (not a redraw).
// He floats idle, eases in with a soft bounce, waves by swapping pose frames,
// points at the chat, thinks while the deck builds, and celebrates when it is
// ready. The speech bubble types out word by word. A fixed-size frame box means
// pose swaps never shift the layout; a grounded emerald spotlight sits at his
// feet. Frames live in /public/mascots.

export type TickyPhase = 'enter' | 'idle' | 'wave' | 'point' | 'thinking' | 'celebrate'

const FRAME = {
  base: '/mascots/ticky.png',       // hands clasped, calm
  waveA: '/mascots/ticky-1.png',    // hand up (side)
  waveB: '/mascots/ticky-4.png',    // hand up (forward)
  think: '/mascots/ticky-2.png',    // hand on chin
  point: '/mascots/ticky-3.png',    // pointing to his left (viewer right)
  celebrate: '/mascots/ticky-5.png',// both fists up
}
const ALL_FRAMES = Object.values(FRAME)

const SIZES = { lg: 250, sm: 118 }
const RATIO = 1.5 // fixed box height = width * RATIO, so frame swaps never reflow

// One float, and only one, for every phase.
//
// This used to return a different keyframe array per phase. Handing Framer a
// new array mid-flight restarts the keyframes from index 0, which snapped Ticky
// back to y=0 from wherever he happened to be, on every phase change. Combined
// with the entrance spring animating `y` on the parent at the same time, that
// is what read as jumping up and down awkwardly.
//
// Now the float is phase-independent and constant, so it never restarts, and it
// only begins once the entrance has finished. Phase changes swap the frame
// image and the secondary accents instead of fighting over `y`.
const FLOAT: TargetAndTransition = {
  y: [0, -6, 0],
  transition: { duration: 7.5, repeat: Infinity, ease: 'easeInOut' },
}
const FLOAT_STILL: TargetAndTransition = { y: 0 }

interface TickyProps {
  phase: TickyPhase
  size?: 'lg' | 'sm'
  bubble?: string | null
  onBubbleTyped?: () => void
  className?: string
}

export function Ticky({ phase, size = 'lg', bubble, onBubbleTyped, className }: TickyProps) {
  const reduced = useReducedMotion()
  const px = SIZES[size]
  const boxH = px * RATIO
  const thinking = phase === 'thinking'
  const [frame, setFrame] = useState<string>(FRAME.base)
  // The idle float only starts once the drop-in has settled, so the two never
  // animate `y` against each other.
  const [entered, setEntered] = useState(false)

  useEffect(() => { ALL_FRAMES.forEach(src => { const i = new Image(); i.src = src }) }, [])

  // Pose frame from phase. The wave is a real two-pose swap, paced gently.
  const timers = useRef<number[]>([])
  useEffect(() => {
    const clear = () => { timers.current.forEach(t => { clearInterval(t); clearTimeout(t) }); timers.current = [] }
    clear()
    if (phase === 'point') setFrame(FRAME.point)
    else if (phase === 'thinking') setFrame(FRAME.think)
    else if (phase === 'celebrate') setFrame(FRAME.celebrate)
    else if (phase === 'wave') {
      let on = false
      setFrame(FRAME.waveA)
      const iv = window.setInterval(() => { on = !on; setFrame(on ? FRAME.waveB : FRAME.waveA) }, 580)
      timers.current.push(iv)
    } else setFrame(FRAME.base)
    return clear
  }, [phase])

  return (
    <div className={`relative flex flex-col items-center ${className ?? ''}`}>
      <AnimatePresence mode="wait">
        {bubble && <AssistantBubble key={bubble} text={bubble} thinking={thinking} reduced={!!reduced} onTyped={onBubbleTyped} />}
      </AnimatePresence>

      {/* soft-bounce entrance wrapper; fixed box so pose swaps never reflow */}
      <motion.div
        className="relative"
        style={{ width: px, height: boxH }}
        initial={reduced ? { opacity: 0 } : { y: -34, opacity: 0, scale: 0.94 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={reduced ? { duration: 0.3 } : { type: 'spring', stiffness: 78, damping: 20, mass: 1 }}
        onAnimationComplete={() => setEntered(true)}
      >
        {/* The float carries the aura, the spotlight base and the frame together,
            so the glow base stays glued centered under Ticky's feet as he moves. */}
        <motion.div className="absolute inset-0" animate={entered && !reduced ? FLOAT : FLOAT_STILL}>
          {/* soft aura so Ticky reads bright and premium against the dark page */}
          <div aria-hidden className="absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ width: px * 1.2, height: px * 1.2, background: 'radial-gradient(circle, rgba(46,148,102,0.26) 0%, transparent 64%)', filter: 'blur(10px)' }} />

          {/* grounded emerald spotlight, centered under the feet (feet ~93% down) */}
          <motion.div
            aria-hidden
            className="absolute -z-10"
            style={{ left: '50%', marginLeft: -(px * 0.92) / 2, top: boxH * 0.93 - (px * 0.24) / 2, width: px * 0.92, height: px * 0.24 }}
            animate={reduced ? undefined : { opacity: thinking ? [0.65, 1, 0.65] : phase === 'celebrate' ? [0.8, 1, 0.8] : [0.62, 0.85, 0.62], scaleX: thinking ? [1, 1.05, 1] : [1, 1.03, 1] }}
            transition={{ duration: thinking ? 1.4 : 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="absolute inset-0 rounded-[50%]" style={{ background: 'radial-gradient(ellipse at center, rgba(95,210,150,0.75) 0%, rgba(46,148,102,0.34) 42%, transparent 72%)', filter: 'blur(5px)' }} />
            <div className="absolute inset-x-[22%] top-[34%] h-[34%] rounded-[50%]" style={{ border: '1px solid rgba(150,245,200,0.5)' }} />
          </motion.div>

          {/* crossfading frame stack: smooth, natural pose changes, no layout jump */}
          <div className="absolute inset-0" style={{ filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.5))' }}>
            <AnimatePresence initial={false}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <motion.img
                key={frame}
                src={frame}
                alt="Ticky"
                draggable={false}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.42, ease: 'easeInOut' }}
                style={{ position: 'absolute', inset: 0, width: px, height: boxH, objectFit: 'contain', objectPosition: 'center bottom', userSelect: 'none' }}
              />
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {phase === 'celebrate' && !reduced && [0, 1, 2, 3, 4, 5].map(i => {
              const a = (i / 6) * Math.PI * 2
              return (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/3 h-2 w-2 rounded-full"
                  style={{ background: i % 2 ? '#3FB07C' : '#FBFBF4' }}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                  animate={{ opacity: [0, 1, 0], x: Math.cos(a) * px * 0.5, y: Math.sin(a) * px * 0.5, scale: [0.4, 1, 0.5] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.1, ease: 'easeOut' }}
                />
              )
            })}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  )
}

// A dark-glass assistant message bubble whose text types out word by word.
// Reads like a chat reply from Ticky, not a cartoon tooltip: frosted dark
// surface, hairline emerald accent rail, clean sans copy, a soft tail pointing
// down toward Ticky, and a smooth spring-in. Responsive width.
function AssistantBubble({ text, thinking, reduced, onTyped }: { text: string; thinking: boolean; reduced: boolean; onTyped?: () => void }) {
  const words = text.split(' ')
  const [count, setCount] = useState(reduced ? words.length : 0)
  const typedRef = useRef(false)
  const cbRef = useRef(onTyped)
  cbRef.current = onTyped

  useEffect(() => {
    if (reduced) { cbRef.current?.(); return }
    let i = 0
    setCount(0)
    const id = window.setInterval(() => {
      i += 1
      setCount(i)
      if (i >= words.length) {
        clearInterval(id)
        if (!typedRef.current) { typedRef.current = true; cbRef.current?.() }
      }
    }, 210)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shown = words.slice(0, count).join(' ')
  const done = count >= words.length

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
      transition={reduced ? { duration: 0.2 } : { type: 'spring', stiffness: 320, damping: 26 }}
      className="relative mb-4 w-[268px] max-w-[84vw]"
    >
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(180deg, rgba(18,24,21,0.92) 0%, rgba(9,12,11,0.94) 100%)',
          border: '1px solid rgba(63,176,124,0.32)',
          boxShadow: '0 18px 44px rgba(0,0,0,0.55), 0 0 28px rgba(46,148,102,0.18), inset 0 1px 0 rgba(255,255,255,0.04)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        {/* emerald accent rail */}
        <span aria-hidden className="absolute left-0 top-0 h-full w-[3px]" style={{ background: 'linear-gradient(180deg, #5FD296 0%, #2E9466 100%)' }} />
        <div className="px-4 py-3 pl-[1.15rem]">
          <p className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(95,210,150,0.75)' }}>Ticky</p>
          <p className="relative min-h-[2.4em] text-[0.86rem] leading-snug" style={{ color: 'var(--text)', letterSpacing: '-0.005em' }}>
            {shown}
            {thinking ? <ThinkingDots /> : !done ? <span aria-hidden style={{ opacity: 0.5 }}> ▌</span> : null}
          </p>
        </div>
      </div>
      {/* soft tail pointing down toward Ticky */}
      <span
        className="absolute -bottom-[7px] left-8 h-3.5 w-3.5 rotate-45"
        style={{
          background: 'rgba(9,12,11,0.94)',
          borderRight: '1px solid rgba(63,176,124,0.32)',
          borderBottom: '1px solid rgba(63,176,124,0.32)',
        }}
      />
    </motion.div>
  )
}

function ThinkingDots() {
  return (
    <span className="ml-1.5 inline-flex align-middle">
      {[0, 1, 2].map(d => (
        <motion.span key={d} className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full" style={{ background: '#5FD296' }}
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }} transition={{ duration: 1.1, repeat: Infinity, delay: d * 0.16, ease: 'easeInOut' }} />
      ))}
    </span>
  )
}
