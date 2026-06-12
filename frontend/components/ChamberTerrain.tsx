'use client'
import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react'

// The rocky foreground of the Discover chamber: layered ridge silhouettes
// with mist between them, like a product shot staged on dark terrain. Pure
// SVG/DOM (crisp at any size, zero GPU cost) with gentle pointer parallax.

const BACK_RIDGE =
  'M0 96 L34 70 L72 86 L118 56 L168 78 L214 50 L262 74 L308 44 L352 68 L398 52 L448 80 L494 48 L540 70 L586 58 L640 84 L688 54 L734 74 L780 46 L828 70 L874 56 L926 80 L972 50 L1018 72 L1066 60 L1118 82 L1158 64 L1200 76 L1200 180 L0 180 Z'
const FRONT_RIDGE =
  'M0 110 L46 84 L92 102 L142 72 L196 96 L244 66 L294 92 L344 60 L390 86 L442 70 L496 98 L546 64 L596 88 L648 74 L702 100 L752 68 L800 90 L852 58 L902 84 L952 70 L1006 96 L1056 62 L1104 86 L1154 74 L1200 92 L1200 180 L0 180 Z'

export function ChamberTerrain({ accent }: { accent: string }) {
  const reduced = useReducedMotion()
  const px = useMotionValue(0)
  const backX = useSpring(useTransform(px, v => v * -9), { stiffness: 40, damping: 18 })
  const frontX = useSpring(useTransform(px, v => v * -17), { stiffness: 60, damping: 16 })

  useEffect(() => {
    if (reduced) return
    const onMove = (e: PointerEvent) => {
      px.set(((e.clientX / window.innerWidth) - 0.5) * 2)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [px, reduced])

  return (
    <div aria-hidden className="absolute inset-x-0 bottom-0 overflow-hidden" style={{ height: '34vh', pointerEvents: 'none' }}>
      {/* aura wash rising off the terrain */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: '70%',
          background: `radial-gradient(ellipse 80% 100% at 50% 100%, ${accent}14 0%, transparent 70%)`,
          filter: 'blur(18px)',
          transition: 'background 1.4s ease',
        }}
      />

      {/* back ridge, drifting gently against the pointer */}
      <motion.svg
        viewBox="0 0 1200 180"
        preserveAspectRatio="none"
        className="absolute bottom-0"
        style={{ left: '-3%', width: '106%', height: '78%', x: reduced ? 0 : backX }}
      >
        <path d={BACK_RIDGE} fill="#0C0E13" />
      </motion.svg>

      {/* mist between ridges */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: '46%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(150,160,175,0.05) 35%, transparent 100%)',
          filter: 'blur(14px)',
        }}
      />

      {/* front ridge, darker and closer */}
      <motion.svg
        viewBox="0 0 1200 180"
        preserveAspectRatio="none"
        className="absolute bottom-0"
        style={{ left: '-4%', width: '108%', height: '52%', x: reduced ? 0 : frontX }}
      >
        <path d={FRONT_RIDGE} fill="#06070A" />
      </motion.svg>

      {/* settling fog at the very bottom */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: '30%', background: 'linear-gradient(180deg, transparent, rgba(5,6,8,0.9))' }}
      />
    </div>
  )
}
