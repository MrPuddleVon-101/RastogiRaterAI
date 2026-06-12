'use client'

import { cn } from '@/lib/utils'
import { useMotionValue, animate, motion } from 'motion/react'
import { useState, useEffect, useRef } from 'react'

// Infinite marquee, adapted from the 21st.dev InfiniteSlider. Differences:
// measures content with a ResizeObserver instead of react-use-measure (no new
// dependency), horizontal flow, and a paused state under reduced motion.

type InfiniteSliderProps = {
  children: React.ReactNode
  gap?: number
  duration?: number
  durationOnHover?: number
  reverse?: boolean
  className?: string
}

export function InfiniteSlider({
  children,
  gap = 16,
  duration = 25,
  durationOnHover,
  reverse = false,
  className,
}: InfiniteSliderProps) {
  const [currentDuration, setCurrentDuration] = useState(duration)
  const contentRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const translation = useMotionValue(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [key, setKey] = useState(0)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const el = contentRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setWidth(entry.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (reduced || width === 0) return
    const contentSize = width + gap
    const from = reverse ? -contentSize / 2 : 0
    const to = reverse ? 0 : -contentSize / 2

    let controls
    if (isTransitioning) {
      controls = animate(translation, [translation.get(), to], {
        ease: 'linear',
        duration: currentDuration * Math.abs((translation.get() - to) / contentSize),
        onComplete: () => {
          setIsTransitioning(false)
          setKey(prev => prev + 1)
        },
      })
    } else {
      controls = animate(translation, [from, to], {
        ease: 'linear',
        duration: currentDuration,
        repeat: Infinity,
        repeatType: 'loop',
        repeatDelay: 0,
        onRepeat: () => {
          translation.set(from)
        },
      })
    }
    return controls?.stop
  }, [key, translation, currentDuration, width, gap, isTransitioning, reverse, reduced])

  const hoverProps = durationOnHover && !reduced
    ? {
        onHoverStart: () => {
          setIsTransitioning(true)
          setCurrentDuration(durationOnHover)
        },
        onHoverEnd: () => {
          setIsTransitioning(true)
          setCurrentDuration(duration)
        },
      }
    : {}

  return (
    <div className={cn('overflow-hidden', className)}>
      <motion.div
        className="flex w-max"
        style={{ x: translation, gap: `${gap}px` }}
        ref={contentRef}
        {...hoverProps}
      >
        {children}
        {children}
      </motion.div>
    </div>
  )
}
