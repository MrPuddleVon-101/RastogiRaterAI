'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useDimensions } from '@/hooks/use-debounced-dimensions'

interface PixelPoint {
  x: number
  y: number
  id: number
  createdAt: number
}

interface PixelTrailProps {
  pixelSize?: number
  fadeDuration?: number
  delay?: number
  pixelClassName?: string
  className?: string
}

export function PixelTrail({
  pixelSize = 24,
  fadeDuration = 500,
  delay = 150,
  pixelClassName = '',
  className,
}: PixelTrailProps) {
  const [containerRef, dimensions] = useDimensions()
  const [pixels, setPixels] = useState<PixelPoint[]>([])
  const counterRef = useRef(0)
  const lastAddRef = useRef(0)

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastAddRef.current < delay) return
      lastAddRef.current = now
      const rect = (containerRef.current as HTMLDivElement | null)?.getBoundingClientRect()
      if (!rect) return
      const x = Math.floor((e.clientX - rect.left) / pixelSize) * pixelSize
      const y = Math.floor((e.clientY - rect.top) / pixelSize) * pixelSize
      if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return
      counterRef.current += 1
      setPixels(prev => [
        ...prev.slice(-80),
        { x, y, id: counterRef.current, createdAt: now },
      ])
    },
    [delay, pixelSize, containerRef]
  )

  useEffect(() => {
    const el = containerRef.current as HTMLDivElement | null
    if (!el) return
    el.addEventListener('mousemove', handleMouseMove)
    return () => el.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove, containerRef])

  // Prune old pixels
  useEffect(() => {
    if (pixels.length === 0) return
    const timer = setInterval(() => {
      const cutoff = Date.now() - fadeDuration - 100
      setPixels(prev => prev.filter(p => p.createdAt > cutoff))
    }, 200)
    return () => clearInterval(timer)
  }, [pixels.length, fadeDuration])

  return (
    <div ref={containerRef} className={cn('relative w-full h-full', className)}>
      {pixels.map(p => {
        const age = Date.now() - p.createdAt
        const opacity = Math.max(0, 1 - age / fadeDuration)
        return (
          <div
            key={p.id}
            className={cn('absolute pointer-events-none', pixelClassName)}
            style={{
              left: p.x,
              top: p.y,
              width: pixelSize,
              height: pixelSize,
              opacity,
              transition: `opacity ${fadeDuration}ms linear`,
            }}
          />
        )
      })}
    </div>
  )
}
