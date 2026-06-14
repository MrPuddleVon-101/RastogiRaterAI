'use client'
import { useEffect, useState } from 'react'
import {
  motion, useMotionValue, useSpring, useTransform, useReducedMotion,
  type MotionValue,
} from 'motion/react'

// The floating finance objects that orbit the hero stock card, the way fruit
// floats around the can in the product-reveal reference: small, crisp, premium
// finance shapes (candlestick clusters, sparkline tiles, ticker chips, coin
// discs, bar minis, price markers). Rendered as DOM/SVG (always sharp, no
// WebGL text issues) with slow drift + pointer parallax. They sit behind the
// card and never catch clicks.

const POS = '#2E9466'
const NEG = '#B23A3A'
const GOLD = '#C9A24C'
const IVORY = '#ECE7DF'

type Kind = 'candles' | 'spark' | 'chip' | 'coin' | 'bars' | 'marker'

interface ObjConfig {
  kind: Kind
  // viewport anchor in %, kept clear of the centre column where the card sits
  top: number
  left: number
  size: number
  depth: number // parallax strength multiplier
  opacity: number
  blur: number
  driftDur: number
  driftDelay: number
  rotate: number
  data?: string // ticker text / arrow direction
  up?: boolean
}

// Deliberate, sparse placement around the edges. Nothing over the centre.
const LAYOUT: ObjConfig[] = [
  { kind: 'candles', top: 20, left: 11, size: 58, depth: 2.0, opacity: 0.5, blur: 0, driftDur: 11, driftDelay: 0, rotate: 3, up: true },
  { kind: 'chip', top: 32, left: 84, size: 96, depth: 2.6, opacity: 0.55, blur: 0, driftDur: 13, driftDelay: 1.4, rotate: -2, data: 'NVDA', up: true },
  { kind: 'spark', top: 62, left: 8, size: 84, depth: 1.7, opacity: 0.45, blur: 0.4, driftDur: 14, driftDelay: 2.2, rotate: 2, up: true },
  { kind: 'coin', top: 73, left: 88, size: 52, depth: 2.2, opacity: 0.4, blur: 0.3, driftDur: 12, driftDelay: 0.8, rotate: 6 },
  { kind: 'bars', top: 14, left: 70, size: 50, depth: 1.4, opacity: 0.4, blur: 0.6, driftDur: 15, driftDelay: 3, rotate: -3 },
  { kind: 'marker', top: 50, left: 93, size: 30, depth: 3.0, opacity: 0.5, blur: 0, driftDur: 10, driftDelay: 1.1, rotate: 0, up: false },
  { kind: 'chip', top: 80, left: 20, size: 86, depth: 1.9, opacity: 0.42, blur: 0.4, driftDur: 13.5, driftDelay: 2.6, rotate: 2, data: 'MSFT', up: true },
  { kind: 'candles', top: 84, left: 60, size: 46, depth: 2.3, opacity: 0.38, blur: 0.5, driftDur: 12.5, driftDelay: 1.9, rotate: -4, up: false },
]

// --- the shapes -----------------------------------------------------------

function tileStyle(accent: string): React.CSSProperties {
  return {
    background: 'linear-gradient(180deg, rgba(24,27,34,0.72) 0%, rgba(13,15,19,0.78) 100%)',
    border: '1px solid rgba(236,231,223,0.12)',
    borderRadius: 12,
    boxShadow: `0 12px 30px rgba(0,0,0,0.45), 0 0 22px ${accent}22, inset 0 1px 0 rgba(236,231,223,0.05)`,
  }
}

function Candles({ size, up }: { size: number; up?: boolean }) {
  const w = size
  const h = size * 0.92
  // four candles, mixed direction with an overall up/down lean
  const candles = up
    ? [{ up: true, t: 0.5, b: 0.2 }, { up: false, t: 0.35, b: 0.55 }, { up: true, t: 0.18, b: 0.45 }, { up: true, t: 0.08, b: 0.3 }]
    : [{ up: false, t: 0.18, b: 0.4 }, { up: true, t: 0.3, b: 0.3 }, { up: false, t: 0.45, b: 0.5 }, { up: false, t: 0.6, b: 0.25 }]
  const cw = w / 5
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      {candles.map((c, i) => {
        const x = cw * (i + 0.5) + cw * 0.5
        const bodyTop = h * c.t
        const bodyH = h * c.b
        const col = c.up ? POS : NEG
        return (
          <g key={i} stroke={col} fill={col}>
            <line x1={x} x2={x} y1={bodyTop - h * 0.12} y2={bodyTop + bodyH + h * 0.12} strokeWidth={1.2} opacity={0.85} />
            <rect x={x - cw * 0.32} y={bodyTop} width={cw * 0.64} height={Math.max(2, bodyH)} rx={1.5} opacity={0.95} />
          </g>
        )
      })}
    </svg>
  )
}

function Spark({ size, accent, up }: { size: number; accent: string; up?: boolean }) {
  const w = size, h = size * 0.6
  const pts = up
    ? `2,${h - 4} ${w * 0.22},${h * 0.62} ${w * 0.42},${h * 0.7} ${w * 0.64},${h * 0.34} ${w * 0.82},${h * 0.42} ${w - 2},6`
    : `2,8 ${w * 0.24},${h * 0.4} ${w * 0.46},${h * 0.32} ${w * 0.66},${h * 0.6} ${w * 0.84},${h * 0.54} ${w - 2},${h - 4}`
  const col = up ? POS : NEG
  return (
    <div className="flex items-center justify-center" style={{ width: w + 16, height: h + 16, ...tileStyle(accent), padding: 8 }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
        <polyline points={pts} fill="none" stroke={col} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
      </svg>
    </div>
  )
}

function Chip({ data, up, accent }: { data: string; up?: boolean; accent: string }) {
  const col = up ? POS : NEG
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2" style={{ ...tileStyle(accent), borderRadius: 999 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 600, color: IVORY, letterSpacing: '0.06em' }}>{data}</span>
      <span style={{ color: col, fontSize: '0.62rem' }}>{up ? '▲' : '▼'}</span>
    </div>
  )
}

function Coin({ size, accent }: { size: number; accent: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <radialGradient id={`coin-${accent.replace('#', '')}`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor={accent} stopOpacity="0.55" />
          <stop offset="1" stopColor={accent} stopOpacity="0.12" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill={`url(#coin-${accent.replace('#', '')})`} stroke="rgba(236,231,223,0.35)" strokeWidth="1" />
      <circle cx="24" cy="24" r="15" fill="none" stroke="rgba(236,231,223,0.25)" strokeWidth="1" />
      {/* tiny rising candle inside */}
      <line x1="24" y1="15" x2="24" y2="33" stroke={IVORY} strokeWidth="1.4" opacity="0.7" />
      <rect x="21" y="19" width="6" height="9" rx="1" fill={IVORY} opacity="0.8" />
    </svg>
  )
}

function Bars({ size }: { size: number }) {
  const w = size, h = size
  const hs = [0.45, 0.7, 0.55, 0.9]
  const bw = w / 6
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      {hs.map((bh, i) => (
        <rect key={i} x={bw * (i * 1.3 + 0.5)} y={h * (1 - bh)} width={bw} height={h * bh} rx={1.5}
          fill={i === hs.length - 1 ? POS : 'rgba(236,231,223,0.45)'} opacity={0.85} />
      ))}
    </svg>
  )
}

function Marker({ size, up }: { size: number; up?: boolean }) {
  const col = up ? POS : NEG
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden>
      <circle cx="15" cy="15" r="14" fill={`${col}22`} stroke={`${col}88`} strokeWidth="1" />
      <path d={up ? 'M15 8 L21 18 L9 18 Z' : 'M15 22 L21 12 L9 12 Z'} fill={col} opacity="0.9" />
    </svg>
  )
}

function Shape({ cfg, accent }: { cfg: ObjConfig; accent: string }) {
  switch (cfg.kind) {
    case 'candles': return <Candles size={cfg.size} up={cfg.up} />
    case 'spark': return <Spark size={cfg.size} accent={accent} up={cfg.up} />
    case 'chip': return <Chip data={cfg.data || 'STONK'} up={cfg.up} accent={accent} />
    case 'coin': return <Coin size={cfg.size} accent={accent} />
    case 'bars': return <Bars size={cfg.size} />
    case 'marker': return <Marker size={cfg.size} up={cfg.up} />
  }
}

// --- one floating object ---------------------------------------------------

function FloatingObject({
  cfg, accent, mx, my, reduced,
}: {
  cfg: ObjConfig
  accent: string
  mx: MotionValue<number>
  my: MotionValue<number>
  reduced: boolean
}) {
  // parallax: shift opposite the pointer, scaled by depth
  const px = useTransform(mx, v => v * cfg.depth * -10)
  const py = useTransform(my, v => v * cfg.depth * -8)

  return (
    <motion.div
      className="absolute"
      style={{
        top: `${cfg.top}%`,
        left: `${cfg.left}%`,
        x: reduced ? 0 : px,
        y: reduced ? 0 : py,
        opacity: cfg.opacity,
        filter: cfg.blur ? `blur(${cfg.blur}px)` : undefined,
        translateX: '-50%',
        translateY: '-50%',
      }}
    >
      {/* inner layer carries the slow drift so it never fights the parallax */}
      <motion.div
        animate={reduced ? undefined : { y: [0, -12, 0, 9, 0], rotate: [0, cfg.rotate, 0, -cfg.rotate * 0.6, 0] }}
        transition={reduced ? undefined : { duration: cfg.driftDur, delay: cfg.driftDelay, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Shape cfg={cfg} accent={accent} />
      </motion.div>
    </motion.div>
  )
}

// --- the layer -------------------------------------------------------------

export function FloatingFinanceObjects({ accent }: { accent: string }) {
  const reduced = useReducedMotion() ?? false
  // Desktop only: on phones the objects would crowd the card. Gated by
  // matchMedia (not a Tailwind responsive class) so it is reliable, and
  // defaulting to false keeps SSR and the first client paint matching.
  const [show, setShow] = useState(false)
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const mx = useSpring(rawX, { stiffness: 40, damping: 18 })
  const my = useSpring(rawY, { stiffness: 40, damping: 18 })

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const apply = () => setShow(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (reduced || !show) return
    // skip on touch-primary devices: no pointer to parallax against
    if (window.matchMedia('(pointer: coarse)').matches) return
    const onMove = (e: PointerEvent) => {
      rawX.set((e.clientX / window.innerWidth) * 2 - 1)
      rawY.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [rawX, rawY, reduced, show])

  if (!show) return null

  return (
    <div aria-hidden className="fixed inset-0" style={{ zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
      {LAYOUT.map((cfg, i) => (
        <FloatingObject key={i} cfg={cfg} accent={accent} mx={mx} my={my} reduced={reduced} />
      ))}
    </div>
  )
}
