// Client-side cache for full rating reports so Discover and deep dives do not
// hammer the backend. In-memory map for the session plus sessionStorage so a
// reload within the tab stays warm.

import { RatingResponse } from './types'
import { rateStock } from './api'

const mem = new Map<string, RatingResponse>()
const failed = new Set<string>()
const inflight = new Map<string, Promise<RatingResponse>>()

const SS_PREFIX = 'rr-report-'

function fromSession(ticker: string): RatingResponse | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(SS_PREFIX + ticker)
    return raw ? (JSON.parse(raw) as RatingResponse) : null
  } catch {
    return null
  }
}

function toSession(ticker: string, data: RatingResponse) {
  try {
    window.sessionStorage.setItem(SS_PREFIX + ticker, JSON.stringify(data))
  } catch {
    // sessionStorage full: in-memory cache still works
  }
}

export function getCachedReport(ticker: string): RatingResponse | null {
  const t = ticker.trim().toUpperCase()
  const hit = mem.get(t)
  if (hit) return hit
  const ss = fromSession(t)
  if (ss) {
    mem.set(t, ss)
    return ss
  }
  return null
}

export function hasFailed(ticker: string): boolean {
  return failed.has(ticker.trim().toUpperCase())
}

/** Fetch a report through the cache. Dedupes concurrent requests per ticker. */
export async function fetchReportCached(ticker: string): Promise<RatingResponse> {
  const t = ticker.trim().toUpperCase()
  const hit = getCachedReport(t)
  if (hit) return hit

  const pending = inflight.get(t)
  if (pending) return pending

  const p = rateStock(t)
    .then(data => {
      mem.set(t, data)
      toSession(t, data)
      failed.delete(t)
      return data
    })
    .catch(err => {
      failed.add(t)
      throw err
    })
    .finally(() => {
      inflight.delete(t)
    })
  inflight.set(t, p)
  return p
}
