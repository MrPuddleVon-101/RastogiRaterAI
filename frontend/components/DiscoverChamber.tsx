'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useReducedMotion } from 'motion/react'
import { DiscoverSpace } from '@/components/DiscoverSpace'
import { ChamberTerrain } from '@/components/ChamberTerrain'
import { FloatingFinanceObjects } from '@/components/FloatingFinanceObjects'

// The Discover chamber stage. Three.js scene when WebGL is available and
// motion is allowed; otherwise the polished 2D space background. SSR is
// disabled for the scene so there is never a hydration crash, and the dark
// base layer paints immediately so the page never flashes white.

const DiscoverThreeScene = dynamic(() => import('@/components/DiscoverThreeScene'), { ssr: false })

export function DiscoverChamber({ accent }: { accent: string }) {
  const reduced = useReducedMotion()
  const [webgl, setWebgl] = useState<boolean | null>(null)
  const [quality, setQuality] = useState<'full' | 'lite'>('full')

  useEffect(() => {
    try {
      const c = document.createElement('canvas')
      setWebgl(Boolean(c.getContext('webgl2') || c.getContext('webgl')))
    } catch {
      setWebgl(false)
    }
    setQuality(window.innerWidth <= 820 ? 'lite' : 'full')
  }, [])

  // Reduced motion or no WebGL: the DOM stage (space gradient + rocky terrain +
  // floating finance objects). This is the only path that uses the DOM layers.
  if (reduced || webgl === false) {
    return (
      <>
        <div aria-hidden className="fixed inset-0" style={{ zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <DiscoverSpace accent={accent} />
          <ChamberTerrain accent={accent} />
        </div>
        <FloatingFinanceObjects accent={accent} />
      </>
    )
  }

  // WebGL path: the real Three.js scene carries ALL the environment (stars,
  // fog, lit asteroids, 3D candlesticks, glow discs, aura). No DOM terrain or
  // DOM objects compete with it, so the cinematic depth is unmistakably 3D.
  return (
    <div aria-hidden className="fixed inset-0" style={{ zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* dark base paints instantly, before the canvas hydrates (no white flash) */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 120% 90% at 50% 0%, #0B0D12 0%, #060709 60%)' }} />
      {webgl && <DiscoverThreeScene accent={accent} quality={quality} />}
      {/* readability vignette over the scene, under the content layer */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(6,7,9,0.42) 0%, transparent 22%, transparent 74%, rgba(6,7,9,0.5) 100%)' }} />
    </div>
  )
}
