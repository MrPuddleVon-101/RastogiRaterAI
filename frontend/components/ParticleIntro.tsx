'use client'
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { ParticleTextEffect } from '@/components/ui/particle-text-effect'

interface ParticleIntroProps {
  /** Repeat visit: jump straight to the locked brand and reveal the input immediately. */
  skipIntro?: boolean
  /** The action block (ticker command bar, Discover button) revealed as the final phase. */
  children?: React.ReactNode
}

// The brand locks at 8.8s on the full timeline. We start the clock at SKIP_TO,
// landing right at the brand-forming phase so the tagline never shows. Particles
// (sped up in build) gather "Stonky" from a scatter within ~2s of load.
const BRAND_LOCK = 8.8
const SKIP_TO = 6.4

function StaticHero() {
  return (
    // Mirrors the particle brand: dominant, seated low in the stage.
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center" style={{ paddingTop: '12vh' }}>
      <span
        aria-hidden
        className="font-bold"
        style={{ color: 'var(--text)', fontSize: 'clamp(3rem, 9.5vw, 6rem)', letterSpacing: '-0.03em', lineHeight: 1 }}
      >
        Stonky
      </span>
    </div>
  )
}

export function ParticleIntro({ skipIntro = false, children }: ParticleIntroProps) {
  const reduced = useReducedMotion()
  const [canvasFailed, setCanvasFailed] = useState(false)
  const readyRef = useRef(false)

  // Safety net: if the particle canvas never reports ready (blocked WebGL-less
  // contexts, very slow devices), fall back to a styled static hero at 9s.
  // The page is dark and premium either way; never a blank white screen.
  useEffect(() => {
    if (reduced || skipIntro) return
    const timer = setTimeout(() => {
      if (!readyRef.current) setCanvasFailed(true)
    }, 9000)
    return () => clearTimeout(timer)
  }, [reduced, skipIntro])

  const instant = skipIntro || reduced || canvasFailed
  const inputDelay = instant ? 0.2 : (BRAND_LOCK - SKIP_TO) + 0.4

  const showStatic = reduced || canvasFailed

  return (
    <div className="relative z-20 w-full flex flex-col" style={{ minHeight: '100vh' }}>
      {/* Screen-reader only. Never visible, so the brand is only ever shown by
          the particles assembling it. */}
      <h1 className="sr-only">Stonky</h1>

      {/* Particle stage (upper) */}
      <div className="relative shrink-0" style={{ height: '54vh' }}>
        {showStatic ? (
          <StaticHero />
        ) : (
          <ParticleTextEffect
            className="absolute inset-0"
            title="Stonky"
            /* Sampled only to size the particle pool; this phase is skipped past,
               so it is never rendered on screen. */
            tagline="Stonky"
            startAt={skipIntro ? BRAND_LOCK - 0.3 : SKIP_TO}
            onReady={() => { readyRef.current = true }}
          />
        )}
      </div>

      {/* The action moment (lower): market strip, then the command bar */}
      <div className="flex-1 flex flex-col items-center px-6 pb-16 pt-2">
        <div className="w-full rr-rise-in" style={{ animationDelay: `${inputDelay}s` }}>
          {children}
        </div>
      </div>
    </div>
  )
}
