import { RatingResponse, ChartResponse, ChartRange, SearchResult } from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function searchSymbols(q: string): Promise<SearchResult[]> {
  const query = q.trim()
  if (!query) return []
  try {
    const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data.results) ? data.results : []
  } catch {
    return []
  }
}

export async function rateStock(ticker: string): Promise<RatingResponse> {
  const url = `${API_BASE}/api/rate?ticker=${encodeURIComponent(ticker.trim().toUpperCase())}`
  console.debug('[api] rateStock →', url)

  let res: Response
  try {
    res = await fetch(url)
  } catch (networkErr) {
    console.error('[api] Network error: backend unreachable?', networkErr)
    throw networkErr
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    // The backend wraps errors: { detail: { detail: "...", ticker: "..." } }
    const message =
      typeof err.detail === 'object'
        ? err.detail.detail || JSON.stringify(err.detail)
        : err.detail || `HTTP ${res.status}`
    console.error('[api] Backend error', res.status, message)
    throw new Error(message)
  }

  return res.json()
}

/**
 * Optional chart endpoint for range / candlestick switching. Backward compatible:
 * the default 1Y data already ships inside the rateStock() response, so this is
 * only called when the user changes range or view.
 */
export async function fetchChart(ticker: string, range: ChartRange): Promise<ChartResponse> {
  const url = `${API_BASE}/api/chart?ticker=${encodeURIComponent(ticker.trim().toUpperCase())}&range=${range}`
  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    const message =
      typeof err.detail === 'object'
        ? err.detail.detail || JSON.stringify(err.detail)
        : err.detail || `HTTP ${res.status}`
    throw new Error(message)
  }
  return res.json()
}
