// ---------------------------------------------------------------------------
// RastogiRaterAI - TypeScript interfaces for the API response
// ---------------------------------------------------------------------------

export interface CategoryScore {
  key: string
  name: string
  score: number
  maxScore: number
  signal: string
  signalArrow: string
  color: 'positive' | 'negative' | 'neutral' | 'caution'
  reason: string
  reasons: string[]
  warnings: string[]
}

export interface Takeaway {
  type: 'positive' | 'negative' | 'neutral' | 'caution'
  label: string
  text: string
}

export interface MetricEvidence {
  category: string
  metric: string
  value: string
  signal: string
  notes: string
  tooltip: string
}

export interface ChartDataPoint {
  date: string
  price: number
  open?: number | null
  high?: number | null
  low?: number | null
  close?: number | null
  ma50: number | null
  ma200: number | null
}

export type ChartRange = '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'MAX'

export interface ChartResponse {
  ticker: string
  range: ChartRange
  chartData: ChartDataPoint[]
}

export interface ChartRead {
  vs52WeekHigh: string
  vs50DayMA: string
  vs200DayMA: string
  summary: string
  hi52Value?: number
}

export interface LongTermThesisBias {
  label: string
  direction: 'Bullish' | 'Bearish' | string
  reason: string
  confidence: 'High' | 'Medium' | 'Low' | string
}

export interface InvestmentThesis {
  label: string
  summary: string
  bullCase: string[]
  bearCase: string[]
  marketMayBeMissing: string[]
  whatNeedsToBeTrue: string[]
  whatCouldBreak: string[]
}

export interface EconomicMoat {
  level: string
  sources: string[]
  explanation: string
  risk: string
}

export interface FairValueView {
  available: boolean
  method: string
  bearCase: string
  baseCase: string
  bullCase: string
  sensitivity?: string
  interpretation?: string
  assumptions: string[]
}

export interface TradingComps {
  available: boolean
  summary: string
  metrics: { label: string; value: string }[]
}

export interface ValuationContext {
  status: string
  multipleRead: string
  fairValueView: FairValueView
  tradingComps: TradingComps
}

export interface Catalysts {
  nearTerm: string[]
  longTermDirection: string[]
  whatToWatch: string[]
  risks: string[]
}

export interface SearchResult {
  symbol: string
  name: string
  exchange: string
}

export interface AnalystConsensus {
  available: boolean
  label: string | null
  analystCount: number | null
  targetLow: number | null
  targetMean: number | null
  targetHigh: number | null
  currentPrice: number | null
  counts: { bullish: number; neutral: number; bearish: number } | null
}

export interface EarningsQuarter {
  period: string
  epsEstimate: number | null
  epsActual: number | null
  surprisePct: number | null
  result: 'beat' | 'miss' | 'match' | null
}

export interface EarningsHistory {
  available: boolean
  quarters: EarningsQuarter[]
}

export interface RatingResponse {
  ticker: string
  companyName: string
  sector: string | null
  industry: string | null
  currentPrice: number | null
  marketCap: number | null
  currency?: string
  overallScore: number
  ratingLabel: string
  nuancedLabel: string
  dataConfidence: number
  oneLineVerdict: string
  rastogiVerdictAnalyst: string
  rastogiVerdictBeginner: string
  categoryScores: CategoryScore[]
  takeaways: Takeaway[]
  drivers: string[]
  drags: string[]
  neutral: string[]
  metricEvidence: MetricEvidence[]
  chartData: ChartDataPoint[]
  chartRead: ChartRead
  warnings: string[]
  // New analysis layers (optional for backward compatibility)
  longTermThesisBias?: LongTermThesisBias
  analystConsensus?: AnalystConsensus
  earningsHistory?: EarningsHistory
  investmentThesis?: InvestmentThesis
  economicMoat?: EconomicMoat
  valuationContext?: ValuationContext
  catalysts?: Catalysts
  dataNote?: string
}

export interface ApiError {
  detail: string
  ticker: string
}
