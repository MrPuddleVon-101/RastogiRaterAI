// Ticky's deterministic stock matcher. No live LLM: it parses the user's plain
// request, maps it to intent tags, scores the curated deck universe against
// those tags, and returns a ranked deck plus a short human summary. "Stocks like
// NVDA" resolves the named ticker and ranks the rest by profile similarity.

import { DECK_UNIVERSE, DeckEntry } from './deck'

export interface TickyResult {
  entries: DeckEntry[]
  summary: string
  intents: string[]
}

// Curated profile tags per ticker. These are intentionally hand-set so Ticky's
// picks read as deliberate rather than random.
const TAGS: Record<string, string[]> = {
  NVDA: ['ai', 'momentum', 'compounder', 'growth', 'tech', 'semis', 'longterm'],
  MSFT: ['ai', 'compounder', 'quality', 'tech', 'lowrisk', 'dividend', 'longterm'],
  AAPL: ['compounder', 'quality', 'tech', 'lowrisk', 'dividend', 'longterm'],
  AVGO: ['ai', 'dividend', 'semis', 'tech', 'momentum', 'compounder'],
  COST: ['lowrisk', 'quality', 'defensive', 'compounder', 'longterm'],
  JPM: ['dividend', 'value', 'financials', 'lowrisk'],
  V: ['compounder', 'quality', 'tech', 'lowrisk', 'longterm'],
  MA: ['compounder', 'quality', 'tech', 'longterm'],
  GOOGL: ['ai', 'value', 'tech', 'compounder', 'longterm'],
  AMZN: ['ai', 'growth', 'tech', 'compounder', 'longterm'],
  ASML: ['ai', 'semis', 'tech', 'compounder', 'quality'],
  TSM: ['ai', 'semis', 'tech', 'value', 'compounder', 'dividend'],
  LLY: ['momentum', 'growth', 'healthcare', 'quality', 'compounder'],
  'BRK-B': ['lowrisk', 'value', 'quality', 'defensive', 'longterm'],
  META: ['ai', 'momentum', 'tech', 'growth', 'value'],
  NFLX: ['momentum', 'growth', 'tech'],
  AMD: ['ai', 'semis', 'tech', 'momentum', 'growth', 'pullback'],
  ORCL: ['ai', 'tech', 'dividend', 'momentum', 'compounder'],
  CRM: ['ai', 'tech', 'growth', 'value'],
  UNH: ['value', 'healthcare', 'dividend', 'lowrisk', 'pullback'],
  'TCS.NS': ['dividend', 'tech', 'quality', 'lowrisk', 'value'],
  'RELIANCE.NS': ['value', 'dividend', 'energy'],
  'INFY.NS': ['dividend', 'tech', 'value', 'lowrisk'],
  'HDFCBANK.NS': ['financials', 'compounder', 'quality', 'value', 'lowrisk'],
  'TATAMOTORS.NS': ['value', 'momentum', 'pullback'],
  '7203.T': ['value', 'dividend', 'lowrisk', 'quality'],
  '005930.KS': ['value', 'semis', 'tech', 'dividend', 'momentum'],
  '0700.HK': ['tech', 'value', 'growth', 'ai', 'momentum'],
  'MC.PA': ['quality', 'compounder', 'longterm', 'lowrisk'],
}

// General-quality fallback ordering, used to break ties and to seed a default
// deck when the request matches no intent.
const BASE_RANK = [
  'NVDA', 'MSFT', 'AAPL', 'GOOGL', 'AMZN', 'META', 'V', 'MA', 'COST', 'LLY',
  'AVGO', 'ASML', 'TSM', 'BRK-B', 'JPM', 'ORCL', 'NFLX', 'AMD', 'CRM', 'UNH',
  'MC.PA', 'HDFCBANK.NS', 'TCS.NS', 'RELIANCE.NS', 'INFY.NS', '005930.KS',
  '0700.HK', '7203.T', 'TATAMOTORS.NS',
]
const rankOf = (sym: string) => {
  const i = BASE_RANK.indexOf(sym)
  return i < 0 ? BASE_RANK.length : i
}

// Intent keyword groups. Each intent maps the user's phrasing to a profile tag.
const INTENTS: { tag: string; label: string; keywords: string[] }[] = [
  { tag: 'ai', label: 'AI names', keywords: ['ai', 'a.i', 'artificial intelligence', 'machine learning', 'compute', 'gpu'] },
  { tag: 'compounder', label: 'quality compounders', keywords: ['compounder', 'compound', 'wide moat', 'moat', 'quality'] },
  { tag: 'lowrisk', label: 'lower-risk ideas', keywords: ['low risk', 'low-risk', 'lower risk', 'safe', 'safer', 'defensive', 'stable', 'conservative'] },
  { tag: 'value', label: 'undervalued picks', keywords: ['undervalued', 'cheap', 'value', 'bargain', 'discount', 'underpriced'] },
  { tag: 'momentum', label: 'momentum movers', keywords: ['momentum', 'trending', 'breakout', 'hot', 'running'] },
  { tag: 'dividend', label: 'dividend payers', keywords: ['dividend', 'income', 'yield', 'payout'] },
  { tag: 'pullback', label: 'pullback setups', keywords: ['pullback', 'dip', 'oversold', 'correction', 'beaten down', 'sold off'] },
  { tag: 'growth', label: 'growth names', keywords: ['growth', 'grower', 'fast growing', 'hypergrowth'] },
  { tag: 'longterm', label: 'long-term winners', keywords: ['long term', 'long-term', 'long run', 'hold forever', 'buy and hold', 'winners', 'winner', 'decade'] },
  { tag: 'tech', label: 'tech names', keywords: ['tech', 'technology', 'software', 'cloud', 'internet'] },
  { tag: 'healthcare', label: 'healthcare names', keywords: ['health', 'healthcare', 'pharma', 'biotech', 'drug'] },
  { tag: 'financials', label: 'financials', keywords: ['bank', 'financial', 'financials', 'fintech', 'payments'] },
]

/** Find a ticker the user named, e.g. "stocks like NVDA" or "similar to Apple". */
function findNamedTicker(q: string): DeckEntry | null {
  for (const e of DECK_UNIVERSE) {
    const root = e.symbol.replace(/\..*$/, '').replace(/-/g, '').toLowerCase()
    const name = e.name.toLowerCase()
    // word-boundary-ish match on the symbol root or the company name
    if (root.length >= 2 && new RegExp(`\\b${root}\\b`).test(q)) return e
    if (name.length >= 3 && q.includes(name)) return e
  }
  return null
}

function phrase(intents: string[]): string {
  const labels = intents
    .map(t => INTENTS.find(i => i.tag === t)?.label)
    .filter(Boolean) as string[]
  if (labels.length === 0) return 'a broad starter deck of high-quality names'
  if (labels.length === 1) return labels[0]
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
}

/**
 * Build Ticky's deck from a free-text request.
 * @param query  the user's request
 * @param limit  max cards in the deck
 */
export function buildTickyDeck(query: string, limit = 9): TickyResult {
  const q = ` ${query.toLowerCase().trim()} `

  // 1) "stocks like X" path: rank by profile similarity to the named ticker.
  const wantsSimilar = /\b(like|similar to|such as)\b/.test(q)
  const named = findNamedTicker(q)
  if (wantsSimilar && named) {
    const targetTags = new Set(TAGS[named.symbol] ?? [])
    const ranked = DECK_UNIVERSE
      .filter(e => e.symbol !== named.symbol)
      .map(e => ({ e, score: (TAGS[e.symbol] ?? []).filter(t => targetTags.has(t)).length }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score || rankOf(a.e.symbol) - rankOf(b.e.symbol))
      .slice(0, limit)
      .map(x => x.e)
    const entries = ranked.length ? [named, ...ranked].slice(0, limit) : DECK_UNIVERSE.slice(0, limit)
    return {
      entries,
      summary: `Stocks with a similar profile to ${named.name}.`,
      intents: ['similar'],
    }
  }

  // 2) Intent path: collect matched tags from the request.
  const matched: string[] = []
  for (const intent of INTENTS) {
    if (intent.keywords.some(k => q.includes(` ${k} `) || q.includes(`${k} `) || q.includes(` ${k}`))) {
      matched.push(intent.tag)
    }
  }

  let entries: DeckEntry[]
  if (matched.length === 0) {
    // No intent recognised: a confident default deck.
    entries = BASE_RANK.slice(0, limit)
      .map(sym => DECK_UNIVERSE.find(e => e.symbol === sym))
      .filter((e): e is DeckEntry => !!e)
  } else {
    const wanted = new Set(matched)
    entries = DECK_UNIVERSE
      .map(e => ({ e, score: (TAGS[e.symbol] ?? []).filter(t => wanted.has(t)).length }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score || rankOf(a.e.symbol) - rankOf(b.e.symbol))
      .slice(0, limit)
      .map(x => x.e)
    // Top up with quality names if the intent was very narrow.
    if (entries.length < Math.min(5, limit)) {
      for (const sym of BASE_RANK) {
        if (entries.length >= Math.min(6, limit)) break
        const e = DECK_UNIVERSE.find(x => x.symbol === sym)
        if (e && !entries.includes(e)) entries.push(e)
      }
    }
  }

  const n = entries.length
  return {
    entries,
    summary: `Ticky lined up ${n} ${phrase(matched)}.`,
    intents: matched,
  }
}
