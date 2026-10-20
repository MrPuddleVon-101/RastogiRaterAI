'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { MessageSquareText, Layers, Bookmark, ArrowUpRight } from 'lucide-react'
import { DeckEntry } from '@/lib/deck'
import { fetchReportCached } from '@/lib/reportCache'
import { buildTickyDeck } from '@/lib/tickyMatch'
import { ReportAura } from '@/components/ReportAura'
import { Atmosphere } from '@/components/Atmosphere'
import { Ticky, TickyPhase } from '@/components/ticky/Ticky'
import { TickyChat } from '@/components/ticky/TickyChat'
import { TickyDeck } from '@/components/ticky/TickyDeck'
import { WatchlistControl } from '@/components/WatchlistControl'
import { StonkyNav } from '@/components/StonkyNav'
import { useWatchlist, addToWatchlist } from '@/lib/watchlist'

// Ask Ticky: an AI-assistant style stock-discovery page. Ticky (a real mascot,
// animated by his image frames) floats in, types out a guiding greeting, points
// at the chat, the user describes what they want, Ticky thinks, then a swipeable
// deck appears. Matching is deterministic (lib/tickyMatch). Saving uses the one
// shared watchlist (lib/watchlist). Backgrounds: a subtle emerald matrix over
// the Stonky grid for the chat/intake, and the calmer grid + report waves for
// the deck so it shares the report's atmosphere.

type Phase = 'ask' | 'thinking' | 'deck'

const GREETING = "Hey, I'm Ticky, your ticker finder. Tell me what you're after and I'll dig up a deck."
const POINT_HINT = 'Type it below, or grab one of my hunches.'
const NUDGE = "Stuck? Tap one of my hunches and we're off."
const FOCUS_LINE = "Go on, I'm all ears."
const RESET_HINT = 'Round two. What are you in the mood for?'
const THINKING = ['On it. Reading the tape...', 'Hunting your kind of stock...', 'Digging through the market...', 'Lining up the shortlist...']
const CELEBRATE = ["Boom. Locked in.", "Got 'em. Take a look.", 'Nailed it. Your deck is ready.', 'Found your shortlist.']
const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

// Tiny "how it works" guide, so a first-time user knows exactly what happens.
const STEPS = [
  { icon: MessageSquareText, title: 'Tell Ticky', body: 'Your goal, risk, horizon, or a stock you like, in plain English.' },
  { icon: Layers, title: 'Get a deck', body: 'Ticky scores public data and lines up a shortlist that fits.' },
  { icon: Bookmark, title: 'Save or dive', body: 'Swipe to add to your watchlist, or deep dive into a full report.' },
]

export default function DiscoverPage() {
  const [phase, setPhase] = useState<Phase>('ask')
  const [tickyPhase, setTickyPhase] = useState<TickyPhase>('enter')
  const [bubble, setBubble] = useState<string | null>(null)
  const [deck, setDeck] = useState<DeckEntry[]>([])
  const [summary, setSummary] = useState('')
  const [deckKey, setDeckKey] = useState(0)
  const [watchlistOpen, setWatchlistOpen] = useState(false)
  const { items: watchlistItems } = useWatchlist()

  const timers = useRef<number[]>([])
  const clearTimers = useCallback(() => { timers.current.forEach(t => clearTimeout(t)); timers.current = [] }, [])
  const after = useCallback((ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)) }, [])

  useEffect(() => {
    // One-time migration: any stocks saved under the old separate Discover key
    // are MERGED into the shared watchlist (dedup handled by addToWatchlist),
    // then the dead key is removed. This recovers items saved in the previous
    // version that were stranded and not showing in the watchlist.
    try {
      const old = window.localStorage.getItem('stonky-discover-wishlist')
      if (old) {
        const arr = JSON.parse(old)
        if (Array.isArray(arr)) arr.forEach(it => addToWatchlist(it))
        window.localStorage.removeItem('stonky-discover-wishlist')
      }
    } catch { /* ignore */ }
    setTickyPhase('enter')
    after(1100, () => setBubble(GREETING)) // float in first, then start talking
    return clearTimers
  }, [after, clearTimers])

  // After the greeting finishes typing, Ticky waves, points at the chat, then
  // gently nudges the user toward a hunch if they linger.
  const handleGreetingTyped = useCallback(() => {
    if (phase !== 'ask' || tickyPhase !== 'enter') return
    setTickyPhase('wave')
    after(1700, () => {
      setTickyPhase('point')
      after(9000, () => setBubble(NUDGE))
    })
  }, [phase, tickyPhase, after])

  // Ticky reacts when the user engages the chat box (after the intro has landed).
  const handleChatFocus = useCallback((f: boolean) => {
    if (phase !== 'ask') return
    if (tickyPhase === 'enter' || tickyPhase === 'wave') return
    clearTimers() // cancel any pending nudge
    setTickyPhase('point')
    setBubble(f ? FOCUS_LINE : POINT_HINT)
  }, [phase, tickyPhase, clearTimers])

  const handleSubmit = useCallback((text: string) => {
    clearTimers()
    const res = buildTickyDeck(text)
    setDeck(res.entries)
    setSummary(res.summary)
    res.entries.slice(0, 3).forEach(e => { fetchReportCached(e.symbol).catch(() => {}) })
    setPhase('thinking')
    setTickyPhase('thinking')
    setBubble(pick(THINKING))
    after(2200, () => {
      setPhase('deck')
      setDeckKey(k => k + 1)
      setTickyPhase('celebrate')
      setBubble(pick(CELEBRATE))
      after(1800, () => { setTickyPhase('idle'); setBubble(null) })
    })
  }, [after, clearTimers])

  const handleReset = useCallback(() => {
    clearTimers()
    setPhase('ask')
    setTickyPhase('point')
    setBubble(RESET_HINT)
  }, [clearTimers])

  return (
    <>
      {/* One static ambient layer, same as the home page. This route used to
          mount four always-on effects at once (matrix canvas, quant grid
          canvas, cursor spotlight rAF and the signal trail), which is why Ask
          Ticky was the laggiest screen in the app. The deck still gets its
          report aura, since that one is tied to the score being shown. */}
      <Atmosphere />
      {phase === 'deck' && <ReportAura />}

      {/* Shared floating glass navbar + the one watchlist drawer it opens. */}
      <StonkyNav active="discover" onOpenWatchlist={() => setWatchlistOpen(true)} watchlistCount={watchlistItems.length} />
      <WatchlistControl open={watchlistOpen} onOpenChange={setWatchlistOpen} hideTrigger />

      <div className="relative z-20 flex min-h-screen flex-col">
        <main className="flex flex-1 flex-col">
          <AnimatePresence mode="wait">
            {phase !== 'deck' ? (
              <motion.section
                key="ask"
                className="flex flex-1 flex-col items-center justify-center px-6 pb-8 pt-28"
                initial={false} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4 }}
              >
                <div className="grid w-full max-w-4xl grid-cols-1 items-center gap-x-12 gap-y-6 md:grid-cols-[252px_1fr]">
                  {/* Ticky guides from the side */}
                  <div className="flex justify-center md:justify-start">
                    <Ticky phase={tickyPhase} size="lg" bubble={bubble} onBubbleTyped={handleGreetingTyped} />
                  </div>

                  {/* chat + guidance */}
                  <div className="flex flex-col items-center md:items-start">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: '#3FB07C' }}>Discover</p>
                    <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 3.8rem)', fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1 }}>
                      <span style={{ color: 'var(--text)' }}>Ask </span>
                      <span style={{ color: '#3FB07C', textShadow: '0 0 26px rgba(46,148,102,0.45)' }}>Ticky</span>
                    </h1>
                    <p className="mb-5 mt-3 max-w-md text-center text-sm md:text-left" style={{ color: 'var(--text-2)' }}>
                      Tell Ticky what you&apos;re after, in plain English. He&apos;ll hunt down a deck worth your time.
                    </p>
                    <TickyChat onSubmit={handleSubmit} disabled={phase === 'thinking'} onFocusChange={handleChatFocus} />
                  </div>
                </div>

                {/* How it works — a quiet 3-step guide so the flow is obvious */}
                <div className="mt-12 grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
                  {STEPS.map((s, i) => (
                    <motion.div
                      key={s.title}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-start gap-3 rounded-2xl p-4"
                      style={{
                        background: 'linear-gradient(180deg, rgba(18,24,21,0.5) 0%, rgba(9,12,11,0.55) 100%)',
                        border: '1px solid rgba(63,176,124,0.16)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(46,148,102,0.14)', color: '#5FD296' }}>
                        <s.icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                          <span style={{ color: 'rgba(95,210,150,0.6)', fontFamily: 'var(--font-mono)', marginRight: 6 }}>{i + 1}</span>
                          {s.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{s.body}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            ) : (
              <motion.section
                key="deck"
                className="flex flex-1 flex-col items-center pt-20"
                initial={false} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <Ticky phase={tickyPhase} size="sm" bubble={bubble} className="mb-1" />
                {/* Quick reminder of the controls, so the deck is self-explanatory */}
                <p className="mb-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[0.72rem]" style={{ color: 'var(--muted)' }}>
                  <span className="inline-flex items-center gap-1.5"><Bookmark className="h-3 w-3" /> Add to watchlist</span>
                  <span className="inline-flex items-center gap-1.5"><ArrowUpRight className="h-3 w-3" /> Deep dive into the full report</span>
                </p>
                <TickyDeck key={deckKey} deck={deck} summary={summary} onReset={handleReset} />
              </motion.section>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  )
}
