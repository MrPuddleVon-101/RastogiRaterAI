'use client'
import { motion, useScroll, useSpring } from 'motion/react'

// Thin emerald progress rail pinned to the very top of the landing page.
// Tracks read progress through the whole story. Subtle, premium, non-intrusive.
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 })

  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[70] origin-left"
      style={{
        scaleX,
        height: 2,
        background: 'linear-gradient(90deg, #2E7B54, #5FBF8A 60%, #DCBE6E)',
        boxShadow: '0 0 12px rgba(95,191,138,0.6)',
      }}
    />
  )
}
