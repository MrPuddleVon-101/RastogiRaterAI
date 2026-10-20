'use client'
import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'

// A thin luxury outline ring that trails the real cursor. The OS cursor stays
// visible as the center point; this ring springs to it with a touch of lag so
// it reads as a premium UI detail, not a chunky custom cursor. It sits on its
// own fixed layer above everything, never intercepts pointer events, and works
// alongside the streak + spotlight glow. Disabled on touch / reduced motion.
export function CursorRing() {
  const [enabled, setEnabled] = useState(false)
  const [visible, setVisible] = useState(false)
  const [down, setDown] = useState(false)
  const [hot, setHot] = useState(false) // over an interactive element

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  // Soft, quick spring: present but never sluggish.
  const sx = useSpring(x, { stiffness: 420, damping: 34, mass: 0.45 })
  const sy = useSpring(y, { stiffness: 420, damping: 34, mass: 0.45 })

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setEnabled(!coarse && !reduced)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      x.set(e.clientX)
      y.set(e.clientY)
      if (!visible) setVisible(true)
      const el = e.target as HTMLElement | null
      setHot(!!el?.closest('a,button,input,[role="button"],[data-cursor="hot"]'))
    }
    const leave = () => setVisible(false)
    const dn = () => setDown(true)
    const up = () => setDown(false)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', dn)
    window.addEventListener('pointerup', up)
    document.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', dn)
      window.removeEventListener('pointerup', up)
      document.removeEventListener('mouseleave', leave)
    }
  }, [enabled, visible, x, y])

  if (!enabled) return null

  // ~50% larger than before for a more present, premium ring.
  const size = hot ? 66 : 46

  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 pointer-events-none"
      style={{
        x: sx,
        y: sy,
        zIndex: 70,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: '9999px',
        border: `1px solid ${hot ? 'rgba(95,191,138,0.85)' : 'rgba(236,230,218,0.55)'}`,
        boxShadow: hot
          ? '0 0 18px rgba(46,148,102,0.35), inset 0 0 10px rgba(46,148,102,0.12)'
          : '0 0 12px rgba(236,230,218,0.12)',
        opacity: visible ? 1 : 0,
        transition: 'width 0.22s ease, height 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, opacity 0.3s ease, margin 0.22s ease',
        scale: down ? 0.82 : 1,
      }}
    />
  )
}
