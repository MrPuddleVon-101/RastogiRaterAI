'use client'
import { useEffect, useRef, useState } from 'react'

const STEPS = [
  'pulling market data',
  'checking valuation',
  'reading cash flow',
  'mapping technicals',
  'building verdict',
  'report ready',
]

const STEP_DELAY = 360

interface TerminalLoaderProps {
  loading: boolean
}

export function TerminalLoader({ loading }: TerminalLoaderProps) {
  const [visibleCount, setVisibleCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!loading) {
      setVisibleCount(STEPS.length)
      return
    }
    setVisibleCount(0)
    timerRef.current = setInterval(() => {
      setVisibleCount(c => {
        if (c >= STEPS.length - 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return c
        }
        return c + 1
      })
    }, STEP_DELAY)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [loading])

  const lines = STEPS.slice(0, visibleCount + 1)
  const isLast = visibleCount >= STEPS.length - 1

  return (
    <div
      className="w-full max-w-lg mx-auto mt-8 rounded"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-2)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.78rem',
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-1.5 px-4 py-2.5"
        style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3A3A3A', display: 'inline-block' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3A3A3A', display: 'inline-block' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3A3A3A', display: 'inline-block' }} />
        <span className="flex-1 text-center text-xs" style={{ color: 'var(--faint)' }}>
          analysis
        </span>
      </div>

      {/* Lines */}
      <div className="px-5 py-4 space-y-2">
        {lines.map((step, i) => {
          const isDone = i < lines.length - 1 || isLast
          const isCurrent = i === lines.length - 1 && !isLast
          return (
            <div key={step} className="flex items-center gap-3">
              <span style={{ color: isDone ? 'var(--pos)' : 'var(--accent)' }}>
                {isDone ? '>' : '>'}
              </span>
              <span style={{ color: isDone ? 'var(--text-2)' : 'var(--text)' }}>
                {step}
                {isCurrent && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 7,
                      height: '0.85em',
                      background: 'var(--text)',
                      marginLeft: 4,
                      verticalAlign: 'middle',
                      animation: 'rr-blink 1s step-end infinite',
                    }}
                  />
                )}
              </span>
              {isDone && step === 'report ready' && (
                <span style={{ color: 'var(--pos)', fontSize: '0.7rem' }}>ok</span>
              )}
            </div>
          )
        })}
        {loading && visibleCount >= STEPS.length - 2 && !isLast && (
          <div style={{ color: 'var(--muted)', fontSize: '0.7rem', paddingLeft: '1.4rem', paddingTop: '0.2rem' }}>
            still analysing...
          </div>
        )}
      </div>
    </div>
  )
}
