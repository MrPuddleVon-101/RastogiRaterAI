'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

interface Dimensions {
  width: number
  height: number
}

export function useDimensions(debounceMs = 100): [React.RefObject<HTMLDivElement>, Dimensions] {
  const ref = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const measure = useCallback(() => {
    if (ref.current) {
      setDimensions({
        width: ref.current.offsetWidth,
        height: ref.current.offsetHeight,
      })
    }
  }, [])

  const debouncedMeasure = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(measure, debounceMs)
  }, [measure, debounceMs])

  useEffect(() => {
    measure()
    const observer = new ResizeObserver(debouncedMeasure)
    if (ref.current) observer.observe(ref.current)
    return () => {
      observer.disconnect()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [measure, debouncedMeasure])

  return [ref, dimensions]
}
