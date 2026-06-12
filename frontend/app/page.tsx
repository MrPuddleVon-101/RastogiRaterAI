'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { RatingResponse } from '@/lib/types'
import { fetchReportCached } from '@/lib/reportCache'
import { ParticleIntro } from '@/components/ParticleIntro'
import { GooeyBackground } from '@/components/GooeyBackground'
import { TickerInput } from '@/components/TickerInput'
import { TerminalLoader } from '@/components/TerminalLoader'
import { ScoreHero } from '@/components/ScoreHero'
import { CockpitChart } from '@/components/CockpitChart'
import { IntelligenceRail } from '@/components/IntelligenceRail'
import { ValuationContext } from '@/components/ValuationContext'
import { ScoreDNA } from '@/components/ScoreDNA'
import { ScoreContext } from '@/components/ScoreContext'
import { EvidenceTable } from '@/components/EvidenceTable'
import { WatchlistControl } from '@/components/WatchlistControl'
import { StockMarketStrip } from '@/components/StockMarketStrip'
import { Disclaimer } from '@/components/Disclaimer'
import { ReportAura } from '@/components/ReportAura'
import { StonkyMark } from '@/components/StonkyMark'
import { Typewriter } from '@/components/ui/typewriter'
import { MarketCursorFollower } from '@/components/MarketCursorFollower'
import QuantGridBackground from '@/components/ui/quant-grid-background'
import SpotlightBackground from '@/components/ui/spotlight-background'

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

// Slow, deliberate section reveal shared by every report panel.
// Panels tilt up out of the page slightly, like evidence laid on a board.
function Reveal({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion()
  return (
    <div style={{ perspective: 1400 }}>
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 44, rotateX: 5 }}
        whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0, rotateX: 0 }}
        viewport={{ once: true, margin: '-90px' }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '50% 100%' }}
      >
        {children}
      </motion.div>
    </div>
  )
}

export default function Home() {
  const [results, setResults] = useState<RatingResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // null = not yet resolved (one dark frame), true = repeat visit or deep dive
  const [introSeen, setIntroSeen] = useState<boolean | null>(null)
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

  useEffect(() => {
    if (results && reportRef.current) {
      const t = setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 140)
      return () => clearTimeout(t)
    }
  }, [results])

  const newSearch = () => {
    setResults(null)
    setError(null)
    try {
      window.history.replaceState(null, '', window.location.pathname)
    } catch { /* cosmetic */ }
  }

  const navDelay = introSeen ? 0.4 : 9.4
  const onReport = Boolean(results || loading)

  return (
    <>
      {/* Global cinematic backdrop: dark quant grid + cursor spotlight */}
      <QuantGridBackground />
      <SpotlightBackground />
      {/* Signal trail: lively on the landing stage, calm over the dossier */}
      <MarketCursorFollower intensity={onReport ? 'calm' : 'full'} />

      {!results && !loading ? (
        <div key="landing" className="relative z-20">
          {/* Minimal landing nav, revealed after the intro */}
          <nav
            className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-5 rr-fade-up"
            style={{ animationDelay: `${navDelay}s` }}
          >
            <StonkyMark size={28} />
            <div className="flex items-center gap-5">
              <Link
                href="/discover"
                className="text-xs tracking-[0.14em] uppercase transition-colors"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-2)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >
                Discover stocks
              </Link>
              <WatchlistControl onSelect={handleSubmit} />
            </div>
          </nav>

          <div className="relative overflow-hidden" style={{ minHeight: '100vh' }}>
            <GooeyBackground />
            {introSeen === null ? (
              // Dark stage while the session intro flag resolves (one frame).
              <div style={{ minHeight: '100vh' }} />
            ) : (
              <ParticleIntro skipIntro={introSeen}>
                {/* Brand line: fixed prefix, rotating finance phrase */}
                <p
                  className="text-center mb-8"
                  style={{ color: 'var(--text-2)', fontSize: 'clamp(1.05rem, 2.2vw, 1.35rem)', fontWeight: 500, letterSpacing: '-0.01em' }}
                >
                  Built to{' '}
                  <span style={{ color: '#5FBF8A' }}>
                    <Typewriter
                      text={[
                        'invest smarter',
                        'research faster',
                        'compare clearly',
                        'discover stocks',
                        'think colder',
                        'pressure-test the story',
                      ]}
                      speed={62}
                      waitTime={1800}
                      deleteSpeed={32}
                      cursorChar="|"
                      className="font-semibold"
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
                <div className="flex items-center justify-center mt-7">
                  <Link
                    href="/discover"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-all"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-2)', boxShadow: 'var(--shadow-sm)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-2)' }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)', display: 'inline-block' }} />
                    Discover stocks
                  </Link>
                </div>
              </ParticleIntro>
            )}
          </div>

          <div className="px-6 pb-10">
            <div className="max-w-5xl mx-auto">
              <Disclaimer />
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          key="results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="min-h-screen relative z-20"
        >
          <ReportAura />

          {/* Compact sticky header */}
          <header
            className="sticky top-0 z-40 px-6 py-3.5"
            style={{ background: 'rgba(7,7,9,0.86)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)' }}
          >
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={newSearch} aria-label="Stonky home, new search">
                  <StonkyMark size={24} />
                </button>
                <span className="hidden sm:inline text-xs" style={{ color: 'var(--faint)' }}>
                  A colder look at hot stocks.
                </span>
              </div>
              <div className="flex items-center gap-5">
                <Link
                  href="/discover"
                  className="text-xs transition-colors"
                  style={{ color: 'var(--muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                >
                  Discover
                </Link>
                <button
                  onClick={newSearch}
                  className="text-xs transition-all"
                  style={{ color: 'var(--muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                >
                  New search
                </button>
                <WatchlistControl onSelect={handleSubmit} />
              </div>
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-6 py-8 relative z-10">
            <TickerInput onSubmit={handleSubmit} loading={loading} compact />
            {loading && <TerminalLoader loading={loading} />}
            {error && !loading && <ErrorPanel message={error} />}

            {results && !loading && (
              <div ref={reportRef}>
                {/* 1. Report hero: identity, score, both biases, cold take */}
                <ScoreHero data={results} />

                {results.dataNote && (
                  <p className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--muted)', borderLeft: '2px solid var(--border-3)', paddingLeft: '0.9rem', maxWidth: 640 }}>
                    {results.dataNote}
                  </p>
                )}

                {/* 2. The Stock Cockpit: chart left, intelligence rail right */}
                <section className="mt-12">
                  <p className="eyebrow mb-5" style={{ color: 'var(--accent)' }}>Stock Cockpit</p>
                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] gap-6 items-start">
                    <Reveal>
                      {/* Left column: chart, candle read, then Score DNA fills
                          the space beside the taller intelligence rail. The
                          donut IS the score breakdown; no duplicate below. */}
                      <CockpitChart
                        ticker={results.ticker}
                        data={results.chartData}
                        chartRead={results.chartRead}
                        hi52={results.chartRead.hi52Value}
                        currency={results.currency}
                      />
                      <ScoreDNA data={results} />
                      {/* Reading the Score fills the left column so its
                          bottom lines up with Key Risks on the right */}
                      <ScoreContext data={results} />
                    </Reveal>
                    <Reveal>
                      <IntelligenceRail data={results} />
                    </Reveal>
                  </div>
                </section>

                {/* 3. Valuation detail: fair value model, assumptions, comps */}
                {results.valuationContext && (
                  <Reveal><ValuationContext vc={results.valuationContext} /></Reveal>
                )}

                {/* 4. Evidence */}
                <Reveal>
                  <EvidenceTable
                    metrics={results.metricEvidence}
                    drivers={results.drivers}
                    drags={results.drags}
                    neutral={results.neutral}
                  />
                </Reveal>

                <Disclaimer />
              </div>
            )}
          </main>
        </motion.div>
      )}
    </>
  )
}
