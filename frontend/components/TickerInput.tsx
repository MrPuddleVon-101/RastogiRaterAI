'use client'
import { useId, useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react'
import { motion } from 'motion/react'
import { Search } from 'lucide-react'
import { GooeyFilter } from '@/components/ui/gooey-filter'
import { searchSymbols } from '@/lib/api'
import { SearchResult } from '@/lib/types'

// NOTE: the installed components/ui/gooey-input.tsx is a collapsing search
// widget, wrong for a persistent command bar, so we build a dedicated bar and
// reuse the installed <GooeyFilter /> SVG for the real liquid merge.

const SAMPLE_TICKERS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AVGO', 'JPM', 'COST']

interface TickerInputProps {
  onSubmit: (ticker: string) => void
  loading: boolean
  compact?: boolean
}

export function TickerInput({ onSubmit, loading, compact = false }: TickerInputProps) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const skipNext = useRef(false)
  const rawId = useId()
  const filterId = `goo-cmd-${rawId.replace(/:/g, '')}`

  // Debounced company / ticker search.
  useEffect(() => {
    const q = value.trim()
    if (skipNext.current) { skipNext.current = false; return }
    if (q.length < 2) { setSuggestions([]); setOpen(false); return }
    let cancelled = false
    const t = setTimeout(async () => {
      const res = await searchSymbols(q)
      if (!cancelled) {
        setSuggestions(res)
        setOpen(res.length > 0)
        setActive(-1)
      }
    }, 200)
    return () => { cancelled = true; clearTimeout(t) }
  }, [value])

  const choose = (symbol: string) => {
    skipNext.current = true
    setValue(symbol)
    setOpen(false)
    setSuggestions([])
    onSubmit(symbol)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (open && active >= 0 && suggestions[active]) {
      choose(suggestions[active].symbol)
      return
    }
    const t = value.trim()
    if (t) { setOpen(false); onSubmit(t) }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  const barHeight = compact ? 54 : 72

  return (
    <div className={compact ? 'w-full max-w-xl mx-auto' : 'w-full max-w-2xl mx-auto'}>
      <GooeyFilter id={filterId} strength={8} />

      {/* relative anchor for the suggestions dropdown */}
      <div className="relative">
        <form
          onSubmit={submit}
          className="relative"
          style={{
            height: barHeight,
            transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1)',
            transform: focused && !compact ? 'scale(1.015)' : 'scale(1)',
          }}
        >
          <div
            className={focused ? 'rr-glow' : ''}
            style={{
              position: 'absolute', inset: -10, borderRadius: 999,
              background: 'radial-gradient(60% 120% at 70% 50%, rgba(201,162,76,0.22), transparent 70%)',
              filter: 'blur(12px)', opacity: focused ? 0.9 : 0.4, transition: 'opacity 0.4s ease', pointerEvents: 'none',
            }}
          />

          <div aria-hidden style={{ position: 'absolute', inset: 0, filter: `url(#${filterId}) drop-shadow(0 12px 30px rgba(0,0,0,0.5))` }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'linear-gradient(180deg, var(--ivory) 0%, var(--ivory-2) 100%)' }} />
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                style={{ position: 'absolute', right: 8 + i * 16, top: '50%', width: barHeight * 0.82, height: barHeight * 0.82, marginTop: -(barHeight * 0.41), borderRadius: 999, background: 'var(--ivory-2)' }}
                animate={{ scale: focused ? [1, 1.18, 0.95, 1] : [1, 1.06, 1], x: focused ? [0, -4, 2, 0] : [0, 2, 0] }}
                transition={{ duration: focused ? 2.4 : 4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}
              />
            ))}
          </div>

          <div className="relative flex items-center h-full pr-2" style={{ paddingLeft: compact ? 18 : 24 }}>
            <Search
              aria-hidden
              size={compact ? 16 : 20}
              strokeWidth={2.25}
              style={{ color: 'var(--ink-2)', flexShrink: 0, marginRight: compact ? 10 : 14, opacity: 0.75 }}
            />
            <input
              value={value}
              onChange={e => setValue(e.target.value.toUpperCase())}
              onFocus={() => { setFocused(true); if (suggestions.length) setOpen(true) }}
              onBlur={() => { setFocused(false); setTimeout(() => setOpen(false), 150) }}
              onKeyDown={onKeyDown}
              placeholder="Enter a ticker or company name"
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
              role="combobox"
              aria-expanded={open}
              aria-autocomplete="list"
              className="flex-1 bg-transparent outline-none"
              style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)', fontSize: compact ? '0.95rem' : '1.02rem', letterSpacing: '0.06em' }}
            />
            <button
              type="submit"
              disabled={loading || !value.trim()}
              className="flex items-center gap-2 rounded-full transition-all"
              style={{
                height: barHeight - 14, padding: compact ? '0 1.2rem' : '0 1.4rem',
                color: 'var(--ink)', fontWeight: 600, fontSize: compact ? '0.85rem' : '0.92rem',
                cursor: loading || !value.trim() ? 'default' : 'pointer', opacity: !value.trim() && !loading ? 0.45 : 1,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 999, background: loading ? 'var(--ink-2)' : 'var(--accent)', display: 'inline-block' }} />
              {loading ? 'Scoring' : 'Run score'}
            </button>
          </div>
        </form>

        {/* Autocomplete dropdown: solid ivory panel, dark text, premium. */}
        {open && suggestions.length > 0 && (
          <div
            className="absolute left-0 right-0 overflow-y-auto"
            style={{
              top: 'calc(100% + 10px)',
              zIndex: 60,
              background: 'linear-gradient(180deg, #F1ECE1 0%, #E6DFCF 100%)',
              border: '1px solid rgba(0,0,0,0.14)',
              borderRadius: 14,
              boxShadow: '0 26px 64px rgba(0,0,0,0.6)',
              maxHeight: 320,
            }}
          >
            {suggestions.map((s, i) => {
              const activeRow = active === i
              return (
                <button
                  key={`${s.symbol}-${i}`}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); choose(s.symbol) }}
                  onMouseEnter={() => setActive(i)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{
                    background: activeRow ? 'rgba(154,123,46,0.16)' : 'transparent',
                    borderLeft: `3px solid ${activeRow ? '#9A7B2E' : 'transparent'}`,
                    borderBottom: i < suggestions.length - 1 ? '1px solid rgba(26,26,18,0.08)' : 'none',
                  }}
                >
                  <span className="flex-1 truncate" style={{ color: '#1A1A12', fontSize: '0.92rem', fontWeight: 500 }}>
                    {s.name}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color: '#1A1A12', background: 'rgba(26,26,18,0.08)', padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                    {s.symbol}
                  </span>
                  {s.exchange && (
                    <span style={{ color: '#7C7660', fontSize: '0.68rem', whiteSpace: 'nowrap', minWidth: 58, textAlign: 'right' }}>
                      {s.exchange}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Sample chips */}
      <div className="flex items-center justify-center gap-2 flex-wrap mt-5">
        <span className="text-xs mr-1" style={{ color: 'var(--faint)' }}>Try</span>
        {SAMPLE_TICKERS.map(t => (
          <button
            key={t}
            onClick={() => choose(t)}
            disabled={loading}
            className="px-3 py-1.5 rounded-full text-xs transition-all"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', cursor: loading ? 'default' : 'pointer' }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text)' } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-2)' }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}
