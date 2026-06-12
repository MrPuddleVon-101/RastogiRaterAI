'use client'
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'

// The Discover chamber: a quiet outer-space stage. A starfield drifts slowly,
// volumetric mist breathes, and an aura tinted by the active stock flows
// outward and crossfades as the deck advances. Everything sits behind the
// content layer and stays dark enough that text never fights it.

interface DiscoverSpaceProps {
  /** Accent color of the active stock; the aura crossfades when it changes. */
  accent: string
}

interface Star { x: number; y: number; r: number; phase: number; speed: number }

function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0, H = 0
    let stars: Star[] = []
    let raf = 0

    const build = () => {
      W = window.innerWidth
      H = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.min(150, Math.floor((W * H) / 11000))
      stars = []
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.3 + 0.4,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.022 + 0.006,
        })
      }
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H)
      for (const s of stars) {
        if (!reduced) {
          s.x -= s.speed
          s.y += s.speed * 0.4
          if (s.x < -2) s.x = W + 2
          if (s.y > H + 2) s.y = -2
        }
        const tw = reduced ? 0.55 : 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.0011 + s.phase))
        ctx.globalAlpha = tw
        ctx.fillStyle = '#ECE7DF'
        ctx.fillRect(s.x, s.y, s.r, s.r)
      }
      ctx.globalAlpha = 1
      if (!reduced) raf = requestAnimationFrame(draw)
    }

    build()
    if (reduced) draw(0)
    else raf = requestAnimationFrame(draw)

    const onResize = () => build()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [reduced])

  return <canvas ref={canvasRef} className="absolute inset-0" style={{ width: '100%', height: '100%' }} aria-hidden />
}

export function DiscoverSpace({ accent }: DiscoverSpaceProps) {
  const reduced = useReducedMotion()

  return (
    <div aria-hidden className="fixed inset-0" style={{ zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* deep space base */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 120% 90% at 50% 0%, #0B0D12 0%, #060709 60%)' }} />

      <Starfield />

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
