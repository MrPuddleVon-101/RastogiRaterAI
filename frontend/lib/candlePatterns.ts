import { ChartDataPoint } from './types'

// Bias is always directional. There is no neutral read.
export type Bias = 'bullish' | 'bearish'
export type Confidence = 'Low' | 'Medium' | 'High'

export interface CandleRead {
  bias: Bias
  pattern: string
  why: string
  confidence: Confidence
  context: string
}

function o(c: ChartDataPoint) { return c.open ?? c.price }
function cl(c: ChartDataPoint) { return c.close ?? c.price }
function hi(c: ChartDataPoint) { return c.high ?? c.price }
function lo(c: ChartDataPoint) { return c.low ?? c.price }
function bodyOf(c: ChartDataPoint) { return Math.abs(cl(c) - o(c)) }
function rangeOf(c: ChartDataPoint) { return Math.max(hi(c) - lo(c), 1e-9) }
function upperWick(c: ChartDataPoint) { return hi(c) - Math.max(o(c), cl(c)) }
function lowerWick(c: ChartDataPoint) { return Math.min(o(c), cl(c)) - lo(c) }
function green(c: ChartDataPoint) { return cl(c) >= o(c) }
function closePos(c: ChartDataPoint) { return (cl(c) - lo(c)) / rangeOf(c) } // 0 = at low, 1 = at high
function hasOHLC(c: ChartDataPoint) { return c.open != null && c.high != null && c.low != null && c.close != null }

function context(last: ChartDataPoint): string {
  const ma200 = last.ma200
  if (ma200 == null) return 'The broader trend should be checked against the 50-day and 200-day moving averages.'
  return cl(last) >= ma200
    ? 'The broader trend remains constructive while price holds above the 200-day average.'
    : 'The broader trend looks weaker with price sitting below the 200-day average.'
}

/**
 * Educational candle read. Always returns a Bullish or Bearish short-term bias.
 * When no textbook single-candle pattern is present, the nearest technical
 * structure is classified from recent candle behaviour. This never predicts the
 * next move and never implies buy, sell, or hold.
 */
export function detectCandlePattern(data: ChartDataPoint[]): CandleRead {
  const clean = data.filter(hasOHLC)

  // Fallback when we somehow lack OHLC: lean on the closing trend only.
  if (clean.length < 2) {
    const closes = data.map(d => d.price)
    const up = closes.length >= 2 && closes[closes.length - 1] >= closes[0]
    const last = data[data.length - 1]
    return {
      bias: up ? 'bullish' : 'bearish',
      pattern: up ? 'Recovery attempt' : 'Distribution pressure',
      why: up
        ? 'Recent closes are drifting higher, giving the short-term chart a bullish bias.'
        : 'Recent closes are drifting lower, giving the short-term chart a bearish bias.',
      confidence: 'Low',
      context: last ? context(last) : 'Not enough data to read the broader trend.',
    }
  }

  const last = clean[clean.length - 1]
  const prev = clean[clean.length - 2]
  const ctx = context(last)
  const b = bodyOf(last)
  const r = rangeOf(last)

  // ----- Context signals used for biasing ambiguous structures -----
  const win = clean.slice(-6)
  const trendUp = cl(last) >= cl(win[0])
  const recentCloseUp = cl(last) >= cl(prev)
  const aboveMa50 = last.ma50 != null ? cl(last) >= last.ma50 : trendUp
  const aboveMa200 = last.ma200 != null ? cl(last) >= last.ma200 : trendUp
  const defended = lowerWick(last) >= upperWick(last)
  const rejected = upperWick(last) > lowerWick(last)
  const avgRange = win.reduce((s, c) => s + rangeOf(c), 0) / win.length
  const compression = r < avgRange * 0.7

  // ----- 1. Textbook single-candle patterns (inherent bias) -----
  if (!green(prev) && green(last) && o(last) <= cl(prev) && cl(last) >= o(prev) && b > bodyOf(prev)) {
    return { bias: 'bullish', pattern: 'Bullish Engulfing', confidence: 'Medium', context: ctx,
      why: 'The latest candle fully engulfs the prior down candle, showing buyers stepping in after a pullback and giving the short-term chart a bullish bias.' }
  }
  if (green(prev) && !green(last) && o(last) >= cl(prev) && cl(last) <= o(prev) && b > bodyOf(prev)) {
    return { bias: 'bearish', pattern: 'Bearish Engulfing', confidence: 'Medium', context: ctx,
      why: 'The latest candle engulfs the prior up candle, showing sellers taking control and giving the short-term chart a bearish bias until buyers reclaim the range.' }
  }
  if (lowerWick(last) >= 2 * b && upperWick(last) <= b && b / r < 0.45) {
    return { bias: 'bullish', pattern: 'Hammer', confidence: 'Medium', context: ctx,
      why: 'A long lower wick shows buyers defended lower prices and closed near the top of the range, giving the short-term chart a bullish bias.' }
  }
  if (upperWick(last) >= 2 * b && lowerWick(last) <= b && b / r < 0.45) {
    return { bias: 'bearish', pattern: 'Shooting Star', confidence: 'Medium', context: ctx,
      why: 'A long upper wick shows sellers rejected higher prices and closed near the low of the range, giving the short-term chart a bearish bias.' }
  }
  if (lo(last) > hi(prev)) {
    return { bias: 'bullish', pattern: 'Gap Up', confidence: 'Medium', context: ctx,
      why: 'Price opened and held above the prior candle range, a short-term sign of buying interest that leans the chart bullish.' }
  }
  if (hi(last) < lo(prev)) {
    return { bias: 'bearish', pattern: 'Gap Down', confidence: 'Medium', context: ctx,
      why: 'Price opened and held below the prior candle range, a short-term sign of selling pressure that leans the chart bearish.' }
  }

  // Doji and Inside candles exist, but we still resolve a directional lean.
  const isDoji = b / r < 0.12
  const isInside = hi(last) <= hi(prev) && lo(last) >= lo(prev)

  // ----- 2. Directional vote for ambiguous / structural reads -----
  let bull = 0
  if (aboveMa50) bull++
  if (aboveMa200) bull++
  if (trendUp) bull++
  if (recentCloseUp) bull++
  if (closePos(last) >= 0.5) bull++
  const bias: Bias = bull >= 3 ? 'bullish' : 'bearish'

  if (isDoji || isInside || compression) {
    const lean = bias === 'bullish' ? 'bullish lean' : 'bearish lean'
    const label = isDoji ? 'Doji' : isInside ? 'Inside Candle' : 'Range compression'
    return {
      bias,
      pattern: `${label} with ${lean}`,
      confidence: 'Low',
      context: ctx,
      why: bias === 'bullish'
        ? 'Candles have tightened while price holds the upper half of the range and stays above near-term support, leaning the short-term chart bullish.'
        : 'Candles have tightened while price drifts toward the lower half of the range and struggles at resistance, leaning the short-term chart bearish.',
    }
  }

  // ----- 3. Nearest structure (always directional) -----
  if (bias === 'bullish') {
    if (trendUp && aboveMa50) {
      return { bias, pattern: 'Bullish continuation', confidence: aboveMa200 ? 'Medium' : 'Low', context: ctx,
        why: 'Recent candles keep closing firm with price holding above the 50-day average, keeping the short-term chart on a bullish bias.' }
    }
    if (!trendUp && defended) {
      return { bias, pattern: 'Pullback stabilising', confidence: 'Medium', context: ctx,
        why: 'Recent candles show selling pressure easing after a decline, with buyers defending the lower part of the range. The latest close improved relative to recent candles, giving the short-term chart a bullish bias.' }
    }
    return { bias, pattern: 'Recovery attempt', confidence: 'Low', context: ctx,
      why: 'After recent weakness the latest candles are closing higher and reclaiming part of the range, giving the short-term chart a bullish bias.' }
  } else {
    if (!trendUp && !aboveMa50) {
      return { bias, pattern: aboveMa200 ? 'Bearish continuation' : 'Breakdown pressure', confidence: aboveMa200 ? 'Low' : 'Medium', context: ctx,
        why: 'Recent candles keep closing weak with price below the 50-day average, keeping the short-term chart on a bearish bias.' }
    }
    if (trendUp && rejected) {
      return { bias, pattern: 'Distribution pressure', confidence: 'Medium', context: ctx,
        why: 'Recent candles show repeated rejection near higher prices, with sellers controlling the latest close. That gives the short-term chart a bearish bias until buyers reclaim the recent range.' }
    }
    return { bias, pattern: 'Trend exhaustion risk', confidence: 'Low', context: ctx,
      why: 'The advance is losing momentum as the latest candles close weaker inside the range, tilting the short-term bias bearish.' }
  }
}
