'use client'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'

// The quiet 2D fallback stage for the Discover chamber: volumetric mist
// breathes and an aura tinted by the active stock crossfades as the deck
// advances. Used when WebGL is unavailable or motion is reduced; the rocky
// terrain foreground is layered on top by DiscoverChamber.

interface DiscoverSpaceProps {
  /** Accent color of the active stock; the aura crossfades when it changes. */
  accent: string
}

export function DiscoverSpace({ accent }: DiscoverSpaceProps) {
  const reduced = useReducedMotion()

  return (
    <div aria-hidden className="fixed inset-0" style={{ zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* deep space base */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 120% 90% at 50% 0%, #0B0D12 0%, #060709 60%)' }} />

      {/* aura: crossfades to the active stock's color */}
      <AnimatePresence>
        <motion.div
          key={accent}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.3 : 1.4, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <div
            className="absolute"
            style={{
              left: '50%', top: '46%', width: '120vmin', height: '90vmin',
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(ellipse at center, ${accent}26 0%, ${accent}10 38%, transparent 68%)`,
              filter: 'blur(30px)',
            }}
          />
          <div
            className="absolute"
            style={{
              left: '50%', top: '85%', width: '150vmin', height: '60vmin',
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(ellipse at center, ${accent}14 0%, transparent 65%)`,
              filter: 'blur(40px)',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* volumetric mist, breathing slowly */}
      {!reduced && (
        <>
          <motion.div
            className="absolute"
            style={{
              left: '12%', top: '20%', width: '46vmin', height: '34vmin',
              background: 'radial-gradient(ellipse at center, rgba(236,231,223,0.045), transparent 70%)',
              filter: 'blur(26px)',
            }}
            animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute"
            style={{
              right: '8%', bottom: '14%', width: '52vmin', height: '38vmin',
              background: 'radial-gradient(ellipse at center, rgba(96,138,132,0.05), transparent 70%)',
              filter: 'blur(30px)',
            }}
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* gentle bottom vignette so actions stay readable */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(6,7,9,0.55) 0%, transparent 18%, transparent 70%, rgba(6,7,9,0.6) 100%)' }} />
    </div>
  )
}
