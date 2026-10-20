'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { RatingResponse } from '@/lib/types'
import { fetchReportCached } from '@/lib/reportCache'
// (Link and StonkyMark moved into the shared StonkyNav)
import { ParticleIntro } from '@/components/ParticleIntro'
import { TickerInput } from '@/components/TickerInput'
import { TerminalLoader } from '@/components/TerminalLoader'
import { CockpitChart } from '@/components/CockpitChart'
import { IntelligenceRail } from '@/components/IntelligenceRail'
import { ValuationContext } from '@/components/ValuationContext'
import { ScoreDNA } from '@/components/ScoreDNA'
import { ScoreContext } from '@/components/ScoreContext'
import { EvidenceTable } from '@/components/EvidenceTable'
import { WatchlistControl } from '@/components/WatchlistControl'
import { useWatchlist } from '@/lib/watchlist'
import { StockMarketStrip } from '@/components/StockMarketStrip'
import { Typewriter } from '@/components/ui/typewriter'
import { Disclaimer } from '@/components/Disclaimer'
import { Verdict } from '@/components/report/Verdict'
import { Disclosure } from '@/components/report/Disclosure'
import { ReportAura } from '@/components/ReportAura'
import { Atmosphere } from '@/components/Atmosphere'
import { SmoothScroll } from '@/components/SmoothScroll'
import { StonkyNav } from '@/components/StonkyNav'
import { HeroPortraits } from '@/components/landing/HeroPortraits'
import { ProductStory } from '@/components/landing/ProductStory'
import { SignupCTA } from '@/components/landing/SignupCTA'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingSmoothScroll } from '@/components/landing/LandingSmoothScroll'
import { ScrollProgress } from '@/components/landing/ScrollProgress'
import { TokenCounter } from '@/components/landing/TokenCounter'

function ErrorPanel({ message }: { message: string }) {
  const friendly =
    message.includes('fetch') || message.toLowerCase().includes('failed')
      ? 'Could not reach the analysis engine. Make sure the backend is running at localhost:8000.'
      : message
  return (
    <div
      className="w-full max-w-xl mx-auto mt-6 px-5 py-4 text-sm"
      style={{ background: 'var(--neg-bg)', borderRadius: 12, color: 'var(--text-2)', lineHeight: 1.6 }}
    >
      <span style={{ color: 'var(--neg)', fontWeight: 600 }}>Error. </span>
      {friendly}
    </div>
  )
}

// Resolved once per page load. Module scope makes the read/write pair safe
// under React StrictMode double-effects in dev (the second invocation must
// not see the flag the first one just wrote and wrongly skip the intro).
let introDecision: boolean | null = null

export default function Home() {
  const [results, setResults] = useState<RatingResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // null = not yet resolved (one dark frame), true = repeat visit or deep dive
  const [introSeen, setIntroSeen] = useState<boolean | null>(null)
  const [watchlistOpen, setWatchlistOpen] = useState(false)
  const { items: watchlistItems } = useWatchlist()
  const reportRef = useRef<HTMLDivElement>(null)

  const handleSubmit = useCallback(async (ticker: string) => {
    setLoading(true)
    setError(null)
    setResults(null)
    // The intro never replays once the user has acted.
    setIntroSeen(true)
    try {
      const data = await fetchReportCached(ticker)
      setResults(data)
      try {
        window.history.replaceState(null, '', `?ticker=${encodeURIComponent(data.ticker)}`)
      } catch { /* URL update is cosmetic */ }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Intro plays once per session. Deep-dive links (?ticker=NVDA) skip it and
  // open the report directly.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ticker = params.get('ticker')
    if (introDecision === null) {
      const seen = window.sessionStorage.getItem('rr-intro-seen') === '1'
      introDecision = Boolean(ticker) || seen
      window.sessionStorage.setItem('rr-intro-seen', '1')
    }
    setIntroSeen(introDecision)
    if (ticker) handleSubmit(ticker)
  }, [handleSubmit])

  // Every new report must open at the very top — no preserved or partial scroll
  // from the previous ticker, the landing page, or a deep-dive link. We take
  // manual control of the browser's scroll restoration and force the top across
  // the loading frame and again when results land, resetting Lenis (if any) and
  // the window together. Keyed on the displayed ticker so each fresh search
  // re-runs it, whether triggered from the hero, another page, or in-report.
  const onReportView = Boolean(results || loading)
  useEffect(() => {
    if (!onReportView) return
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    const toTop = () => {
      const lenis = (window as unknown as { __lenis?: { scrollTo: (t: number, o?: object) => void } }).__lenis
      lenis?.scrollTo(0, { immediate: true, force: true })
      window.scrollTo(0, 0)
    }
    toTop()
    // run once more after layout settles so a late reflow can't strand the view
    const r = requestAnimationFrame(toTop)
    return () => cancelAnimationFrame(r)
  }, [onReportView, loading, results?.ticker])

  const newSearch = () => {
    setResults(null)
    setError(null)
    try {
      window.history.replaceState(null, '', window.location.pathname)
    } catch { /* cosmetic */ }
  }

  return (
    <>
      {/* One static ambient layer for the whole app: grid, bloom, grain.
          Replaces the canvas grid + cursor spotlight + signal trail, which
          together ran three always-on rAF loops behind every page. */}
      <Atmosphere />

      {!results && !loading ? (
        <div key="landing" className="relative z-20">
          {/* Premium Lenis smooth scroll + read-progress rail (landing only) */}
          <LandingSmoothScroll />
          <ScrollProgress />

          {/* Floating glass pill navbar (shared across all pages) */}
          <StonkyNav active="home" onOpenWatchlist={() => setWatchlistOpen(true)} watchlistCount={watchlistItems.length} />

          {/* Shared watchlist drawer, driven by the navbar */}
          <WatchlistControl open={watchlistOpen} onOpenChange={setWatchlistOpen} hideTrigger onSelect={handleSubmit} />

          <div className="relative overflow-hidden" style={{ minHeight: '100vh' }}>
            <HeroPortraits />
            {introSeen === null ? (
              // Dark stage while the session intro flag resolves (one frame).
              <div style={{ minHeight: '100vh' }} />
            ) : (
              <ParticleIntro skipIntro={introSeen}>
                {/* Rotating brand line, just under the Stonky title */}
                <p
                  className="text-center mb-8 sm:mb-10"
                  style={{ fontSize: 'clamp(1.05rem, 2.3vw, 1.5rem)', letterSpacing: '-0.01em', fontWeight: 500 }}
                >
                  <span style={{ color: 'var(--text-2)' }}>Built to </span>
                  <span style={{ color: '#5FBF8A' }}>
                    <Typewriter
                      text={['research faster.', 'read the market.', 'find the thesis.', 'cut through the noise.']}
                      speed={58}
                      deleteSpeed={32}
                      waitTime={2100}
                      initialDelay={400}
                      cursorChar="▍"
                      cursorClassName="ml-0.5"
                    />
                  </span>
                </p>

                {/* Flowing market tape sits above the command bar, in view
                    without scrolling: click a card to run its score */}
                <div className="mb-9">
                  <StockMarketStrip onSelect={handleSubmit} />
                </div>

                <TickerInput onSubmit={handleSubmit} loading={loading} />
                {error && !loading && <ErrorPanel message={error} />}
              </ParticleIntro>
            )}
          </div>

          {/* Below-hero product story, CTA, and footer */}
          <ProductStory />
          <SignupCTA />

          {/* Claude token easter egg sits just above the footer */}
          <div className="px-6 pb-2">
            <TokenCounter />
          </div>

          <LandingFooter />
        </div>
      ) : (
        <motion.div
          key="results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="min-h-screen relative z-20"
        >
          {/* Subtle premium smooth scroll, report page only */}
          <SmoothScroll />
          <ReportAura />

          {/* Shared floating glass navbar. Home resets to a fresh search so the
              report's "new search" affordance lives in the same global nav. */}
          <StonkyNav
            active="home"
            onHome={newSearch}
            onOpenWatchlist={() => setWatchlistOpen(true)}
            watchlistCount={watchlistItems.length}
          />
          <WatchlistControl open={watchlistOpen} onOpenChange={setWatchlistOpen} hideTrigger onSelect={handleSubmit} />

          {/* Top padding clears the floating pill navbar so it never overlaps the report */}
          <main className="max-w-6xl mx-auto px-6 pt-28 pb-8 relative z-10">
            <TickerInput onSubmit={handleSubmit} loading={loading} compact />
            {loading && <TerminalLoader loading={loading} />}
            {error && !loading && <ErrorPanel message={error} />}

            {results && !loading && (
              <div ref={reportRef}>
                {/* The answer, alone. Everything below is opt-in.
                    This page used to render ~1,200 words at once: chart,
                    score anatomy, valuation model and all 23 metric rows,
                    before stating a conclusion. */}
                <Verdict data={results} />

                {results.dataNote && (
                  <p className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--muted)', paddingLeft: '0.2rem', maxWidth: 640 }}>
                    {results.dataNote}
                  </p>
                )}

                {/* Layers, each labelled with what it holds and how much of
                    it there is, so opening one is a decision. */}
                <div className="mt-6 grid gap-3">
                  <Disclosure
                    title="Price and chart"
                    summary="A year of price action, moving averages, and how it reads right now."
                    count="252 days"
                    tone="var(--info)"
                  >
                    <CockpitChart
                      ticker={results.ticker}
                      data={results.chartData}
                      chartRead={results.chartRead}
                      hi52={results.chartRead.hi52Value}
                      currency={results.currency}
                    />
                  </Disclosure>

                  <Disclosure
                    title="How the score breaks down"
                    summary="What each of the six categories contributed, and why."
                    count={`${results.categoryScores.length} categories`}
                    tone="var(--brand)"
                  >
                    <ScoreDNA data={results} />
                    <ScoreContext data={results} />
                  </Disclosure>

                  <Disclosure
                    title="Thesis, moat and catalysts"
                    summary="The long-term case, competitive position, and what could move it."
                    tone="var(--violet)"
                  >
                    <IntelligenceRail data={results} />
                  </Disclosure>

                  {results.valuationContext && (
                    <Disclosure
                      title="Valuation detail"
                      summary="Fair-value model, the assumptions behind it, and comparables."
                      tone="var(--caut)"
                    >
                      <ValuationContext vc={results.valuationContext} />
                    </Disclosure>
                  )}

                  <Disclosure
                    title="Every metric, with the reasoning"
                    summary="The full evidence table behind the score. For when you want to check the work."
                    count={`${results.metricEvidence.length} metrics`}
                    tone="var(--neg)"
                  >
                    <EvidenceTable
                      metrics={results.metricEvidence}
                      drivers={results.drivers}
                      drags={results.drags}
                      neutral={results.neutral}
                    />
                  </Disclosure>
                </div>

                <Disclaimer />
              </div>
            )}
          </main>
        </motion.div>
      )}
    </>
  )
}
