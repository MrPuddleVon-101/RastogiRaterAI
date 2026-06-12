'use client'
// Local watchlist persisted in localStorage. No auth, no backend.
// ONE key, ONE shape, ONE hook. Every page (landing, report, discover) reads
// and writes through this module, and every consumer updates instantly via
// the change event (plus the browser storage event for other tabs).

import { useEffect, useState, useCallback } from 'react'

export interface WatchlistItem {
  symbol: string
  name: string
  score?: number
  bias?: string
  addedAt: number
}

const KEY = 'rr-watchlist-v1'
const CHANGE_EVENT = 'rr-watchlist-changed'

function read(): WatchlistItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    // Tolerate older shapes: anything with a symbol string survives.
    return parsed.filter(i => i && typeof i.symbol === 'string')
  } catch {
    return []
  }
}

function write(items: WatchlistItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    // storage full or blocked: watchlist simply does not persist
  }
  try {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
  } catch {
    // event dispatch is best-effort
  }
}

/** Subscribe to watchlist changes from anywhere in the app. Returns unsubscribe. */
export function onWatchlistChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  // Same-page writes fire the custom event; other tabs fire 'storage'.
  const onStorage = (e: StorageEvent) => { if (e.key === KEY || e.key === null) cb() }
  window.addEventListener(CHANGE_EVENT, cb)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb)
    window.removeEventListener('storage', onStorage)
  }
}

export function getWatchlist(): WatchlistItem[] {
  return read()
}

export function isWatched(symbol: string): boolean {
  return read().some(i => i.symbol === symbol)
}

/** Alias kept for clarity at call sites. */
export const isInWatchlist = isWatched

export function addToWatchlist(item: Omit<WatchlistItem, 'addedAt'>): WatchlistItem[] {
  const items = read().filter(i => i.symbol !== item.symbol)
  items.unshift({ ...item, addedAt: Date.now() })
  write(items)
  return items
}

/** Alias kept for clarity at call sites. */
export const saveToWatchlist = addToWatchlist

export function removeFromWatchlist(symbol: string): WatchlistItem[] {
  const items = read().filter(i => i.symbol !== symbol)
  write(items)
  return items
}

/**
 * The one way components should consume the watchlist. State hydrates after
 * mount (SSR-safe, no hydration mismatch) and stays in sync with every other
 * consumer on the page and in other tabs.
 */
export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([])

  useEffect(() => {
    setItems(read())
    return onWatchlistChange(() => setItems(read()))
  }, [])

  const save = useCallback((item: Omit<WatchlistItem, 'addedAt'>) => addToWatchlist(item), [])
  const remove = useCallback((symbol: string) => removeFromWatchlist(symbol), [])
  const has = useCallback((symbol: string) => items.some(i => i.symbol === symbol), [items])

  return { items, save, remove, has }
}
