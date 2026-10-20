'use client'
import Image from 'next/image'
import { motion, useReducedMotion } from 'motion/react'
import {
  Scale, TrendingUp, Banknote, Activity, Users,
  ArrowUpRight as Up, ShieldAlert, Rocket,
} from 'lucide-react'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ParallaxImage } from './ParallaxImage'
import { AnimatedNumber } from './AnimatedNumber'
import { HowItWorks } from './HowItWorks'
import { LiveDemo } from './LiveDemo'
import { ImageDepthCard } from './ImageDepthCard'
import { AskTickyCTA } from './AskTickyCTA'
import { WordReveal } from './WordReveal'
import { ScrollReelTestimonials } from '@/components/ui/scroll-reel-testimonials'

const PICS = '/LandingPagePics'
const PEOPLE = '/people'

// Investing greats, paired with how Stonky puts each idea to work. Portraits are
// the exact files in /public/people (no placeholders, no hotlinks).
const QUOTES = [
  { author: 'Warren Buffett', image: `${PEOPLE}/buffet.png`, alt: 'Warren Buffett', pos: 'center 26%',
    quote: 'The stock market is a device for transferring money from the impatient to the patient.',
    note: 'Stonky is built for the patient side of the trade.' },
  { author: 'Charlie Munger', image: `${PEOPLE}/Munger.png`, alt: 'Charlie Munger', pos: 'center 30%',
    quote: 'The big money is not in the buying and selling, but in the waiting.',
    note: 'Less impulse, more evidence, better watchlists.' },
  { author: 'Peter Lynch', image: `${PEOPLE}/peter-lynch.jpg`, alt: 'Peter Lynch', pos: 'center 24%',
    quote: 'Know what you own, and know why you own it.',
    note: 'Every Stonky score shows the reason behind the number.' },
  { author: 'Benjamin Graham', image: `${PEOPLE}/benjamin-graham.png`, alt: 'Benjamin Graham', pos: 'center 30%',
    quote: 'The individual investor should act consistently as an investor and not as a speculator.',
    note: 'Research first. Speculation second.' },
  { author: 'John Bogle', image: `${PEOPLE}/john-bogle.png`, alt: 'John Bogle', pos: 'center 28%',
    quote: 'Don’t look for the needle in the haystack. Just buy the haystack!',
    note: 'Even index investors need context before conviction.' },
  { author: 'Philip Fisher', image: `${PEOPLE}/philip-fisher.png`, alt: 'Philip Fisher', pos: 'center 28%',
    quote: 'The stock market is filled with individuals who know the price of everything, but the value of nothing.',
    note: 'Stonky looks past price and into the business.' },
  { author: 'Morgan Housel', image: `${PEOPLE}/morgan-housel.jpg`, alt: 'Morgan Housel', pos: 'center 30%',
    quote: 'Good investing is not necessarily about making good decisions. It’s about consistently not screwing up.',
    note: 'Risk matters as much as upside.' },
  { author: 'Benjamin Franklin', image: `${PEOPLE}/benjamin-franklin.jpeg`, alt: 'Benjamin Franklin', pos: 'center 30%',
    quote: 'An investment in knowledge pays the best interest.',
    note: 'Knowing why is the whole point of the platform.' },
]

// Editorial reveal: rises, sharpens, and unblurs into place.
function Reveal({ children, delay = 0, className = '', y = 36 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const MARQUEE = [
  { t: 'AAPL', c: +1.2 }, { t: 'NVDA', c: +2.8 }, { t: 'TSLA', c: -1.4 }, { t: 'MSFT', c: +0.6 },
  { t: 'JPM', c: +0.9 }, { t: 'COST', c: +0.3 }, { t: 'AMZN', c: -0.7 }, { t: 'META', c: +1.9 },
  { t: 'AVGO', c: +2.1 }, { t: 'BRK.B', c: +0.4 }, { t: 'GOOGL', c: -0.5 }, { t: 'NFLX', c: +1.1 },
]

/* ---------------- Score with receipts: one product-grade surface ---------------- */

const RECEIPTS = [
  { icon: Scale, label: 'Valuation', dir: 'up' as const, v: 71, metric: '28× P/E', note: 'vs 34× five-year average' },
  { icon: TrendingUp, label: 'Profitability', dir: 'up' as const, v: 88, metric: '31% ROIC', note: 'top-decile operating margins' },
  { icon: Banknote, label: 'Cash flow & debt', dir: 'up' as const, v: 90, metric: '$60B FCF', note: 'net cash, no leverage risk' },
  { icon: Activity, label: 'Momentum', dir: 'up' as const, v: 76, metric: '+12% est.', note: 'revised up over 90 days' },
  { icon: Users, label: 'Analyst context', dir: 'down' as const, v: 58, metric: '+28% target', note: 'priced for perfection' },
]

function Bar({ value, tone, delay = 0 }: { value: number; tone: string; delay?: number }) {
  const reduced = useReducedMotion()
  return (
    <span className="block h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
      <motion.span
        style={{ display: 'block', height: '100%', borderRadius: 999, background: tone }}
        initial={reduced ? { width: `${value}%` } : { width: 0 }}
        whileInView={{ width: `${value}%` }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay }}
      />
    </span>
  )
}

function ScoreReceipts() {
  const reduced = useReducedMotion()
  const score = 82
  const R = 56
  const C = 2 * Math.PI * R
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
      {/* Cinematic evidence banner (image 8 cropped low to the desk/chart so its
          watermark stays out of frame; the candlestick laptop is the subject). */}
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl lp-card" style={{ height: 'clamp(260px, 34vw, 360px)' }}>
          <div className="absolute inset-0" style={{ filter: 'grayscale(0.5) contrast(1.08) brightness(0.74)' }}>
            <Image src={`${PICS}/8.jpg`} alt="" fill sizes="(max-width: 768px) 100vw, 2160px" style={{ objectFit: 'cover', objectPosition: 'center 86%' }} />
          </div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(100deg, rgba(7,7,9,0.95) 28%, rgba(7,7,9,0.7) 52%, rgba(7,7,9,0.35) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(110% 90% at 0% 0%, rgba(46,148,102,0.14), transparent 55%)' }} />
          <div className="absolute inset-0 flex flex-col justify-center p-7 sm:p-12 max-w-2xl">
            <WordReveal
              text="Every score has receipts."
              highlight={['receipts.']}
              className="t-section"
              style={{ color: 'var(--text)' }}
            />
            <Reveal delay={0.1}>
              <p className="t-lead mt-4">
                Not a vibe and not a black box. One number from 0 to 100, with the exact evidence underneath
                it, so you see what lifts the call and what drags it down.
              </p>
            </Reveal>
          </div>
        </div>
      </Reveal>

      {/* The verdict (sticky) + an editorial evidence ledger */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[0.78fr_1.22fr] gap-6 items-start">
        {/* LEFT — sticky score verdict */}
        <div className="lg:sticky lg:top-24">
          <Reveal>
            <div className="lp-card rounded-3xl p-7 sm:p-8" style={{ background: 'radial-gradient(120% 80% at 30% 0%, rgba(46,148,102,0.16) 0%, rgba(7,7,9,0) 60%), linear-gradient(180deg, var(--surface-2), var(--surface))', boxShadow: '0 34px 80px rgba(0,0,0,0.5)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>NVIDIA Corp</p>
                  <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>NVDA · NASDAQ</p>
                </div>
                <span className="text-[0.6rem] px-2.5 py-1 rounded-full" style={{ background: 'var(--pos-bg)', color: '#5FBF8A', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>STONKY SCORE</span>
              </div>
              <div className="flex items-center gap-6 mt-6">
                <div className="relative shrink-0" style={{ width: 140, height: 140 }}>
                  <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90 origin-center">
                    <circle cx="70" cy="70" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="11" />
                    <motion.circle
                      cx="70" cy="70" r={R} fill="none" stroke="url(#rcv)" strokeWidth="11" strokeLinecap="round"
                      strokeDasharray={C}
                      initial={reduced ? { strokeDashoffset: C * (1 - score / 100) } : { strokeDashoffset: C }}
                      whileInView={{ strokeDashoffset: C * (1 - score / 100) }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                    />
                    <defs>
                      <linearGradient id="rcv" x1="0" y1="0" x2="140" y2="140" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stopColor="#2E7B54" />
                        <stop offset="1" stopColor="#5FBF8A" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <AnimatedNumber value={score} duration={1600} style={{ fontSize: '2.6rem', fontWeight: 700, lineHeight: 1, color: 'var(--text)', fontFamily: 'var(--font-mono)' }} />
                    <span className="text-[0.6rem]" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>OUT OF 100</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#5FBF8A' }}>Strong</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-2)', lineHeight: 1.5 }}>
                    Quality compounding at a price the market has not fully sobered up to.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-[0.7rem] px-2 py-1 rounded-md" style={{ background: 'var(--pos-bg)', color: '#5FBF8A', fontFamily: 'var(--font-mono)' }}>
                    <Up size={11} strokeWidth={2.5} /> +4 this quarter
                  </div>
                </div>
              </div>
              <p className="mt-7 text-[0.7rem]" style={{ color: 'var(--faint)', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
                Five weighted factors, then pressure-tested against risks and catalysts. Open Score DNA for the full math.
              </p>
            </div>
          </Reveal>
        </div>

        {/* RIGHT — one editorial ledger panel: aligned rows, real metrics */}
        <Reveal>
          <div className="lp-card rounded-3xl overflow-hidden" style={{ boxShadow: '0 40px 90px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center justify-between px-5 sm:px-6 py-4" style={{ borderBottom: '1px solid var(--border-2)', background: 'rgba(10,11,14,0.45)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>What&rsquo;s inside the score</p>
              <span className="text-[0.6rem]" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>5 WEIGHTED FACTORS</span>
            </div>

            {RECEIPTS.map((r, i) => {
              const up = r.dir === 'up'
              const tone = up ? '#5FBF8A' : '#D98A6A'
              return (
                <motion.div
                  key={r.label}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, x: 18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.07 }}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-4 sm:gap-5 px-5 sm:px-6 py-4"
                  style={{ borderBottom: '1px solid var(--border-2)' }}
                >
                  <span className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 38, height: 38, background: 'var(--surface-3)', border: '1px solid var(--border-2)' }}>
                    <r.icon size={16} style={{ color: tone }} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{r.label}</p>
                      <span className="inline-flex items-center gap-1 text-[0.6rem] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: up ? 'var(--pos-bg)' : 'rgba(217,138,106,0.12)', color: tone, fontFamily: 'var(--font-mono)' }}>
                        {up ? '▲ lifts' : '▼ drags'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)', lineHeight: 1.45 }}>{r.note}</p>
                    <div className="mt-2 max-w-[220px]"><Bar value={r.v} tone={tone} delay={0.15 + i * 0.05} /></div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', fontSize: 'clamp(1.05rem, 1.6vw, 1.4rem)' }}>{r.metric}</p>
                    <p className="text-[0.62rem]" style={{ color: 'var(--faint)', fontFamily: 'var(--font-mono)' }}>{r.v}/100</p>
                  </div>
                </motion.div>
              )
            })}

            {/* the two-sided read */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5 sm:p-6">
              <div className="rounded-xl p-4" style={{ background: 'linear-gradient(180deg, rgba(46,148,102,0.14), rgba(46,148,102,0.03))', border: '1px solid rgba(63,176,124,0.3)' }}>
                <p className="flex items-center gap-2 text-xs font-semibold mb-1.5" style={{ color: '#5FBF8A' }}><Rocket size={13} /> Catalysts</p>
                <p className="text-xs" style={{ color: 'var(--text-2)', lineHeight: 1.55 }}>New product cycle, buybacks, and estimates that keep getting revised up.</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: 'linear-gradient(180deg, rgba(217,138,106,0.12), rgba(217,138,106,0.03))', border: '1px solid rgba(217,138,106,0.28)' }}>
                <p className="flex items-center gap-2 text-xs font-semibold mb-1.5" style={{ color: '#D98A6A' }}><ShieldAlert size={13} /> Risks</p>
                <p className="text-xs" style={{ color: 'var(--text-2)', lineHeight: 1.55 }}>A rich multiple, customer concentration, and a cyclical demand swing.</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------------- The film strip: investors, not gamblers ---------------- */

const STRIP = [
  {
    src: `${PICS}/6.jpg`, fit: 'contain' as const, position: 'center',
    kicker: 'THE NOISE', caption: 'The loudest guy in the room is selling something.',
    filter: 'grayscale(0.2) contrast(1.05)',
  },
  {
    src: `${PICS}/10.png`, fit: 'cover' as const, position: 'center 30%',
    kicker: '09:30 SHARP', caption: 'The bell doesn’t wait. Neither should your research.',
    filter: 'grayscale(0.3) contrast(1.06) brightness(0.9)',
  },
  {
    src: `${PICS}/9.png`, fit: 'cover' as const, position: 'center 20%',
    kicker: 'THE WALK', caption: 'Walk in prepared. Leave the guessing to everyone else.',
    filter: 'grayscale(0.15) contrast(1.05) brightness(0.92)',
  },
]

function FilmStrip() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
      <div className="max-w-2xl mb-10">
        <WordReveal
          text="Built for investors, not gamblers."
          highlight={['investors,']}
          className="font-semibold"
          style={{ fontSize: 'clamp(2rem, 5.4vw, 3.4rem)', lineHeight: 1.05, letterSpacing: '-0.035em', color: 'var(--text)' }}
        />
        <Reveal delay={0.1}>
          <p className="t-lead mt-4">
            The market rewards preparation and punishes noise. Stonky exists so you walk onto the floor
            already knowing what you own and why.
          </p>
        </Reveal>
      </div>

      {/* three film stills, staggered heights like a contact sheet */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {STRIP.map((s, i) => (
          <Reveal key={s.kicker} delay={i * 0.08} className={i === 1 ? 'sm:mt-10' : ''}>
            <ImageDepthCard
              src={s.src}
              fit={s.fit}
              position={s.position}
              kicker={s.kicker}
              caption={s.caption}
              filter={s.filter}
              aspect="3 / 4"
            />
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ---------------- Page ---------------- */

export function ProductStory() {
  return (
    <div className="relative">
      {/* Ticker marquee: a quiet pulse of the market under the hero */}
      <div className="relative py-6" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'rgba(10,11,14,0.5)' }}>
        <div className="lp-edge-fade">
          <InfiniteSlider gap={40} duration={42} durationOnHover={90}>
            {MARQUEE.map((m, i) => (
              <span key={i} className="inline-flex items-center gap-2 text-sm whitespace-nowrap" style={{ fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-2)', letterSpacing: '0.06em' }}>{m.t}</span>
                <span style={{ color: m.c >= 0 ? '#5FBF8A' : '#D98A6A' }}>{m.c >= 0 ? '+' : ''}{m.c.toFixed(1)}%</span>
                <span style={{ color: 'var(--faint)' }}>•</span>
              </span>
            ))}
          </InfiniteSlider>
        </div>
      </div>

      {/* The promise: bold opening + cinematic Wall St still */}
      <section className="max-w-6xl mx-auto px-6 pt-20 sm:pt-28 pb-10 sm:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
          <div>
            <WordReveal
              text="Start with a ticker. Leave with a thesis."
              highlight={['thesis.']}
              className="t-hero"
              style={{ color: 'var(--text)' }}
            />
            <Reveal delay={0.15}>
              <p className="t-lead mt-5">
                Stonky answers the only question that matters: should I own this company?
                Everything below is how it earns that answer.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <ParallaxImage
              src={`${PICS}/5.jpg`}
              position="center 22%"
              amount={10}
              interactive
              className="h-[340px] sm:h-[440px]"
              filter="grayscale(0.25) contrast(1.06) brightness(0.9)"
              overlay="linear-gradient(180deg, rgba(7,7,9,0.05) 0%, rgba(7,7,9,0.35) 58%, rgba(7,7,9,0.92) 100%)"
            >
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--accent-2)', letterSpacing: '0.14em' }}>11 WALL ST</p>
                <p className="mt-1 text-base sm:text-lg font-medium max-w-xs" style={{ color: 'var(--text)' }}>
                  The data the desks fight over, on your side of the glass.
                </p>
              </div>
            </ParallaxImage>
          </Reveal>
        </div>
      </section>

      {/* What the product does, in plain language with checkable numbers.
          Replaces two pinned scenes (260vh + 440vh) that showed floating
          chips and stage labels but never said what Stonky produces. */}
      <HowItWorks />

      {/* The product itself, running live against the real engine. This
          supersedes the old hand-built score mock, which was a static
          illustration of a report rather than a report. */}
      <LiveDemo />

      {/* ACT IV — the culture: investors, not gamblers (film strip) */}
      <FilmStrip />

      {/* Investing greats: a scroll-reel of portraits + quotes, each tied to Stonky */}
      <section className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
        <div className="max-w-2xl mb-10">
          <WordReveal
            text="The best investors said it first."
            highlight={['first.']}
            className="t-sub"
            style={{ color: 'var(--text)' }}
          />
          <Reveal delay={0.1}>
            <p className="t-lead mt-4">
              Patience, evidence, knowing what you own. Stonky just makes that discipline the default instead
              of the exception.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.1} className="flex justify-center">
          <ScrollReelTestimonials testimonials={QUOTES} />
        </Reveal>
      </section>

      {/* The payoff — the "Winner." still, cleanly aligned, paired with sharp copy */}
      <section className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-16 items-center">
          <Reveal>
            <ImageDepthCard
              src={`${PICS}/3.png`}
              fit="contain"
              kicker="THE REWARD"
              caption="The reward for doing the homework."
              filter="grayscale(0.12) contrast(1.05)"
              aspect="4 / 5"
              className="mx-auto w-full max-w-[420px]"
            />
          </Reveal>
          <Reveal delay={0.1}>
            <WordReveal
              text="Research first. Conviction second."
              highlight={['Conviction']}
              className="t-section"
              style={{ color: 'var(--text)' }}
            />
            <p className="t-lead mt-5">
              Stonky users don&rsquo;t chase green candles or tips from a group chat. They open the report, read the
              evidence, size the risk, and move like the calmest, best-prepared person in the room.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              {['Calmer', 'Better informed', 'Harder to rattle'].map(c => (
                <span key={c} className="px-4 py-2 rounded-full text-xs" style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border-2)', fontFamily: 'var(--font-mono)' }}>{c}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Cinematic divider: bull vs bear */}
      <section className="relative">
        <ParallaxImage
          src={`${PICS}/14.png`}
          position="center 45%"
          amount={10}
          rounded={0}
          className="h-[60vh] min-h-[420px] w-full"
          filter="grayscale(1) contrast(1.12) brightness(0.5)"
          overlay="radial-gradient(80% 80% at 50% 50%, rgba(7,7,9,0.45) 0%, rgba(7,7,9,0.9) 100%)"
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <p className="mb-4" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--accent-2)', letterSpacing: '0.22em' }}>MONEY NEVER SLEEPS</p>
            <WordReveal
              text="Research like you mean it."
              highlight={['mean']}
              className="t-hero"
              style={{ color: 'var(--text)' }}
            />
            <Reveal delay={0.15}>
              <p className="mt-5 max-w-md mx-auto" style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>
                Search any ticker and get the full thesis in seconds.
              </p>
            </Reveal>
          </div>
        </ParallaxImage>
      </section>

      {/* The bridge into the assistant */}
      <AskTickyCTA />
    </div>
  )
}
