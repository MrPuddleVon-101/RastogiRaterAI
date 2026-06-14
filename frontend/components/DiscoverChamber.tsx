'use client'
import { useEffect } from 'react'
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { AuraTheme } from '@/lib/auraTheme'

// The Discover chamber background. The rocky moon-floor environment is the
// actual Higgsfield-generated plate (public/discover-moonfloor.jpg), rendered
// full-bleed behind the stock card with gentle pointer parallax. Procedural
// terrain was dropped in favour of the real art-directed image. On top sit only
// light, non-destructive layers: a per-company hue wash, a colored aura bloom
// that breathes and adapts to the active stock, and subtle top/bottom scrims so
// the header and card stay readable without drowning the terrain in black.

const PLATE = '/discover-moonfloor.jpg'

export function DiscoverChamber({ theme }: { theme: AuraTheme }) {
  const reduced = useReducedMotion()
  const aura = theme.glow

  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 60, damping: 18 })
  const sy = useSpring(py, { stiffness: 60, damping: 18 })
  // the plate drifts slightly toward the pointer; the aura drifts the other way
  // for a layered, parallaxed sense of depth.
  const plateX = useTransform(sx, [-1, 1], [-18, 18])
  const plateY = useTransform(sy, [-1, 1], [-12, 12])
  const auraX = useTransform(sx, [-1, 1], [12, -12])
  const auraY = useTransform(sy, [-1, 1], [9, -9])

  useEffect(() => {
    if (reduced) return
    const onMove = (e: PointerEvent) => {
      px.set((e.clientX / window.innerWidth) * 2 - 1)
      py.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reduced, px, py])

  return (
    <div aria-hidden className="fixed inset-0" style={{ zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* instant dark base so there is never a white flash before the image decodes */}
      <div className="absolute inset-0" style={{ background: '#070709' }} />

      {/* PRIMARY: the Higgsfield moon-floor plate, full-bleed with gentle parallax.
          The placeholder device was removed from the asset itself, so the plate is
          rendered near-natural and its dark centre sits behind the real card while
          the rocky terrain, foreground boulders, planet, plinth and floating
          elements frame it on all sides. */}
      <motion.div
        className="absolute inset-0"
        style={reduced ? undefined : { x: plateX, y: plateY }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PLATE}
          alt=""
          loading="eager"
          className="w-full h-full"
          style={{ objectFit: 'cover', objectPosition: 'center 56%', transform: 'scale(1.08)' }}
        />
      </motion.div>

      {/* Per-company hue wash: keeps the rock looking natural but nudges the whole
          plate toward cool brand themes. soft-light brightens/tints, never blacks out. */}
      <div className="absolute inset-0" style={{ background: aura, mixBlendMode: 'soft-light', opacity: 0.2 }} />

      {/* Soft seat: a gentle deepening behind the card that blends the asset's dark
          centre into the page. Light and fading early so the surrounding moon-floor,
          boulders, planet and floating elements stay bright and read as the frame. */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(40% 46% at 50% 54%, rgba(6,7,10,0.62) 0%, rgba(6,7,10,0.3) 42%, transparent 72%)' }} />

      {/* PRIMARY AURA: a colored bloom behind the card that breathes and morphs to
          the active company's color. screen blend = additive, so it never darkens. */}
      <motion.div
        className="absolute inset-0"
        style={reduced ? { mixBlendMode: 'screen' } : { x: auraX, y: auraY, mixBlendMode: 'screen' }}
      >
        <motion.div
          className="absolute"
          style={{
            left: '50%', top: '46%', width: '74vw', height: '72vh',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(closest-side, ${aura}73 0%, ${aura}26 40%, transparent 72%)`,
            filter: 'blur(6px)',
          }}
          animate={reduced ? undefined : { opacity: [0.72, 0.95, 0.72], scale: [1, 1.05, 1] }}
          transition={reduced ? undefined : { duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Subtle cinematic fog seating the card on the floor — light, fades to clear
          so the foreground rock stays visible. */}
      <div className="absolute inset-x-0 bottom-0" style={{ height: '18%', background: 'linear-gradient(to top, rgba(7,7,10,0.4) 0%, transparent 100%)' }} />
      {/* Subtle top scrim for header legibility only — the asset's own dark sky
          carries the top, so this stays light. */}
      <div className="absolute inset-x-0 top-0" style={{ height: '20%', background: 'linear-gradient(to bottom, rgba(6,7,9,0.72) 0%, transparent 100%)' }} />
    </div>
  )
}
