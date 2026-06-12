'use client'
import { useScreenSize } from '@/hooks/use-screen-size'
import { PixelTrail } from '@/components/ui/pixel-trail'
import { GooeyFilter } from '@/components/ui/gooey-filter'

export function GooeyBackground() {
  const screenSize = useScreenSize()
  const pixelSize = screenSize.lessThan('md') ? 20 : 28

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <GooeyFilter id="rr-gooey" strength={6} />
      <div
        className="absolute inset-0"
        style={{ filter: 'url(#rr-gooey)', pointerEvents: 'auto' }}
      >
        <PixelTrail
          pixelSize={pixelSize}
          fadeDuration={700}
          delay={220}
          pixelClassName="bg-amber-300/10"
        />
      </div>
    </div>
  )
}
