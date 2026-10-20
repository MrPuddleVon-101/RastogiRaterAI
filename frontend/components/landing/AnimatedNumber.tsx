'use client'
import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'motion/react'

interface AnimatedNumberProps {
  value: number
  duration?: number
  /** Decimal places to render. */
  decimals?: number
  prefix?: string
  suffix?: string
  /** Group thousands with commas. */
  group?: boolean
  className?: string
  style?: React.CSSProperties
}

// Counts from 0 to `value` the first time it scrolls into view. Eased, reduced
// motion safe, tabular figures so the layout never jitters mid-count.
export function AnimatedNumber({
  value,
  duration = 1500,
  decimals = 0,
  prefix = '',
  suffix = '',
  group = false,
  className,
  style,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduced = useReducedMotion()
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduced) { setN(value); return }
    let raf = 0
    const start = performance.now()
    const ease = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      setN(value * ease(p))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration, reduced])

  const formatted = group
    ? n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : n.toFixed(decimals)

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums', ...style }}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
