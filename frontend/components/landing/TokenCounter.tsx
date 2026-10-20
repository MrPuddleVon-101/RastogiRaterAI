'use client'
import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'motion/react'

// Easter egg: counts Claude tokens from 0 up to the target when scrolled into
// view, then locks with a trailing plus. Subtle, premium, slightly funny.
export function TokenCounter({ target = 25_000_000, duration = 2600 }: { target?: number; duration?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const reduced = useReducedMotion()
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduced) { setVal(target); return }
    let raf = 0
    const start = performance.now()
    const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      setVal(Math.round(target * easeOutExpo(p)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, target, duration, reduced])

  const done = val >= target

  return (
    <div ref={ref} className="flex justify-center">
      <div
        className="inline-flex items-center gap-3 rounded-full px-4 py-2.5"
        style={{
          background: 'rgba(14,15,19,0.7)',
          border: '1px solid var(--border-2)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* Claude sunburst mark */}
        <span
          className="flex items-center justify-center rounded-lg shrink-0"
          style={{ width: 26, height: 26, background: 'linear-gradient(150deg, #E8865A 0%, #C96442 100%)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <g stroke="#1a0d07" strokeWidth="2.4" strokeLinecap="round">
              <line x1="12" y1="3" x2="12" y2="21" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
              <line x1="18.4" y1="5.6" x2="5.6" y2="18.4" />
            </g>
          </svg>
        </span>
        <span className="text-xs sm:text-sm" style={{ color: 'var(--text-2)', letterSpacing: '-0.01em' }}>
          Claude Tokens Burned Building This Thing:{' '}
          <span
            style={{ color: '#3FB07C', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
          >
            {val.toLocaleString('en-US')}
            {done ? '+' : ''}
          </span>
        </span>
      </div>
    </div>
  )
}
