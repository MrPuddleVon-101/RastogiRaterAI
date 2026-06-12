'use client'
import { useState, useEffect } from 'react'

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const BREAKPOINTS: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

interface ScreenSize {
  width: number
  height: number
  lessThan: (bp: Breakpoint) => boolean
  greaterThan: (bp: Breakpoint) => boolean
  between: (min: Breakpoint, max: Breakpoint) => boolean
}

export function useScreenSize(): ScreenSize {
  const [size, setSize] = useState({ width: 1024, height: 768 })

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return {
    width: size.width,
    height: size.height,
    lessThan: (bp: Breakpoint) => size.width < BREAKPOINTS[bp],
    greaterThan: (bp: Breakpoint) => size.width > BREAKPOINTS[bp],
    between: (min: Breakpoint, max: Breakpoint) =>
      size.width >= BREAKPOINTS[min] && size.width < BREAKPOINTS[max],
  }
}
