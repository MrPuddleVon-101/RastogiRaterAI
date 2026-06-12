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

// Sequence: tagline forms first, dissolves, then the brand locks at 8.8s.
const BRAND_LOCK = 8.8

function StaticHero() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <span
        aria-hidden
        className="font-bold"
        style={{ color: 'var(--text)', fontSize: 'clamp(2.2rem, 7vw, 4.4rem)', letterSpacing: '-0.03em', lineHeight: 1 }}
      >
        RastogiRaterAI
      </span>
      <span aria-hidden style={{ color: 'var(--accent-2)', fontSize: 'clamp(1rem, 2.4vw, 1.4rem)' }}>
        A colder look at hot stocks.
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
  const inputDelay = instant ? 0.2 : BRAND_LOCK + 0.4

  const showStatic = reduced || canvasFailed

  return (
    <div className="relative w-full flex flex-col" style={{ minHeight: '100vh' }}>
      {/* Screen-reader only. Never visible, so the brand is only ever shown by
          the particles assembling it. */}
      <h1 className="sr-only">RastogiRaterAI. A colder look at hot stocks.</h1>

      {/* Particle stage (upper) */}
      <div className="relative shrink-0" style={{ height: '54vh' }}>
        {showStatic ? (
          <StaticHero />
        ) : (
          <ParticleTextEffect
            className="absolute inset-0"
            title="RastogiRaterAI"
            tagline="A colder look at hot stocks."
            startAt={skipIntro ? BRAND_LOCK - 0.3 : 0}
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
