'use client'
import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react'

// A button that leans toward the cursor while hovered and springs back on
// leave. Subtle (max ~10px) so it reads as premium weight, not a gimmick.
// Pointer events stay on the real <button> so clicks/keyboard work normally.
export function MagneticButton({
  children,
  onClick,
  className,
  style,
  strength = 0.35,
  ariaLabel,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
  strength?: number
  ariaLabel?: string
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const reduced = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 })

  const onMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const reset = () => { x.set(0); y.set(0) }

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={reset}
      aria-label={ariaLabel}
      className={className}
      style={{ x: sx, y: sy, ...style }}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </motion.button>
  )
}
