'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useReducedMotion } from 'motion/react'
import { DiscoverSpace } from '@/components/DiscoverSpace'
import { ChamberTerrain } from '@/components/ChamberTerrain'

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

  // Reduced motion or no WebGL: the calm 2D stage, same terrain foreground.
  if (reduced || webgl === false) {
    return (
      <div aria-hidden className="fixed inset-0" style={{ zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <DiscoverSpace accent={accent} />
        <ChamberTerrain accent={accent} />
      </div>
    )
  }

  return (
    <div aria-hidden className="fixed inset-0" style={{ zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* deep space base paints instantly, before the scene hydrates */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 120% 90% at 50% 0%, #0B0D12 0%, #060709 60%)' }} />
      {webgl && <DiscoverThreeScene accent={accent} quality={quality} />}
      {/* rocky product-reveal foreground */}
      <ChamberTerrain accent={accent} />
      {/* readability vignette over the scene, under the content layer */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(6,7,9,0.5) 0%, transparent 20%, transparent 72%, rgba(6,7,9,0.55) 100%)' }} />
    </div>
  )
}
