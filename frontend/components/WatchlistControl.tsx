'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useWatchlist } from '@/lib/watchlist'

interface WatchlistControlProps {
  /** Override how a saved stock opens (the report page loads in place). */
  onSelect?: (symbol: string) => void
}

/**
 * Global watchlist: one top-right control, one drawer, one localStorage list.
 * Mounts on landing, report, and discover; stays in sync via watchlist events.
 */
export function WatchlistControl({ onSelect }: WatchlistControlProps) {
  const router = useRouter()
  const { items, remove } = useWatchlist()
  const [open, setOpen] = useState(false)

  const openStock = useCallback((symbol: string) => {
    setOpen(false)
    if (onSelect) onSelect(symbol)
    else router.push(`/?ticker=${encodeURIComponent(symbol)}`)
  }, [onSelect, router])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 rounded-full transition-all"
        style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-2)' }}
      >
        Watchlist{items.length > 0 ? ` (${items.length})` : ''}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.55)' }}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm flex flex-col"
              style={{ background: 'linear-gradient(180deg, var(--surface-2) 0%, var(--surface) 100%)', boxShadow: '-24px 0 60px rgba(0,0,0,0.5)' }}
            >
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--border-2)', boxShadow: 'inset 0 2px 0 rgba(201,162,76,0.35)' }}
              >
                <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                  Watchlist
                  {items.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--accent-bg)', color: 'var(--accent-2)', fontFamily: 'var(--font-mono)' }}>
                      {items.length}
                    </span>
                  )}
                </p>
                <button onClick={() => setOpen(false)} className="text-xs px-2 py-1" style={{ color: 'var(--muted)' }}>
                  Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3">
                {items.length === 0 ? (
                  <p className="text-sm px-2 py-6 text-center" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                    Nothing saved yet. Save stocks from a report or the Discover deck and they will wait here.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {items.map(item => (
                      <div
                        key={item.ticker}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                        style={{ background: 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <button onClick={() => openStock(item.ticker)} className="flex-1 text-left">
                          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{item.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                            {item.ticker}
                            {item.score != null ? `  ·  ${item.score}/100` : ''}
                            {item.rating ? `  ·  ${item.rating}` : ''}
                          </p>
                        </button>
                        <button
                          onClick={() => remove(item.ticker)}
                          className="text-xs px-2 py-1 rounded transition-colors"
                          style={{ color: 'var(--muted)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--neg)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                          aria-label={`Remove ${item.ticker} from watchlist`}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs px-5 py-4" style={{ color: 'var(--faint)', borderTop: '1px solid var(--border-2)', lineHeight: 1.5 }}>
                Stored on this device only. Click a stock to open its full report.
              </p>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
