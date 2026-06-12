'use client'
import { useEffect, useRef, useState } from 'react'

interface AnimatedScoreProps {
  score: number
  label: string
  confidence: number
}

function scoreColor(score: number): string {
  if (score >= 70) return 'var(--pos)'
  if (score >= 55) return 'var(--caut)'
  return 'var(--neg)'
}

export function AnimatedScore({ score, label, confidence }: AnimatedScoreProps) {
  const [display, setDisplay] = useState(0)
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true
    const duration = 1500
    const start = Date.now()
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(score * eased))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [score])

  const color = scoreColor(score)
  const size = 172
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const strokeDash = (display / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* faint backing tint (matte, not neon) */}
        <div
          style={{
            position: 'absolute',
            inset: 18,
            borderRadius: '50%',
            background: color,
            opacity: 0.07,
            filter: 'blur(20px)',
          }}
        />
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)', position: 'relative' }}
        >
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--surface-3)" strokeWidth={6} />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span style={{
            fontSize: '2.9rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text)',
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: '-0.04em',
          }}>
            {display}
          </span>
          <span style={{ fontSize: '0.6rem', color: 'var(--faint)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
            OUT OF 100
          </span>
        </div>
      </div>
      <div className="text-center space-y-1.5">
        <p style={{ color, fontWeight: 600, fontSize: '0.95rem', letterSpacing: '0.06em' }}>
          {label}
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--pos)' }}>{confidence}</span>
          <span style={{ color: 'var(--faint)' }}>/10</span> data confidence
        </p>
      </div>
    </div>
  )
}
