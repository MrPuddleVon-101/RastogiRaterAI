'use client'
import FlowArt, { FlowSection } from '@/components/ui/story-scroll'

interface Chapter {
  num: string
  title: string
  points: number
  question: string
  explanation: string
  rewards: string
}

const CHAPTERS: Chapter[] = [
  {
    num: '01', title: 'Valuation', points: 20,
    question: 'Is the price asking too much?',
    explanation: 'Valuation checks how much investors are paying for earnings, sales, and assets.',
    rewards: 'Reasonable multiples with room for disappointment.',
  },
  {
    num: '02', title: 'Analyst Expectations', points: 15,
    question: 'Do analysts see upside?',
    explanation: 'Analyst expectations read professional estimates as a signal, not as proof.',
    rewards: 'Strong coverage, constructive targets, and useful consensus data.',
  },
  {
    num: '03', title: 'Profitability', points: 20,
    question: 'Does revenue become real profit?',
    explanation: 'Profitability checks whether the company actually keeps money after costs.',
    rewards: 'Strong margins and high returns on capital.',
  },
  {
    num: '04', title: 'Cash Flow & Debt', points: 20,
    question: 'Is there cash behind the story?',
    explanation: 'Cash flow and debt check whether profits are backed by real cash and manageable obligations.',
    rewards: 'Real free cash flow, strong operating cash flow, and controlled leverage.',
  },
  {
    num: '05', title: 'Technical Position', points: 15,
    question: 'Has the chart cooled or cracked?',
    explanation: 'Technical position checks whether the stock has pulled back cleanly or broken down more seriously.',
    rewards: 'Healthy pullbacks, trend support, and less overheated positioning.',
  },
  {
    num: '06', title: 'Data Confidence', points: 10,
    question: 'How complete is the evidence?',
    explanation: 'Data confidence checks whether the score is based on enough usable information.',
    rewards: 'Complete enough data to make the score meaningful.',
  },
]

// One consistent surface family for every chapter. No per-card color themes.
const CARD_BG = 'linear-gradient(168deg, #ECE6DA 0%, #DDD6C7 115%)'
const INK = '#16160F'
const INK_2 = '#4A4A3E'
const ACCENT = '#9A7B2E'

function ChapterCard({ c }: { c: Chapter }) {
  return (
    <div className="flex-1 flex items-center justify-center w-full">
      <div
        className="w-full max-w-4xl mx-auto relative overflow-hidden"
        style={{
          background: CARD_BG,
          borderRadius: 22,
          boxShadow: '0 40px 90px rgba(0,0,0,0.55), 0 2px 0 rgba(255,255,255,0.35) inset',
          padding: 'clamp(2rem, 5vw, 4rem)',
          color: INK,
        }}
      >
        {/* small category accent strip (same family, no color theming) */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: ACCENT, opacity: 0.85 }} />

        <div className="flex items-start justify-between mb-8">
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(2.6rem, 7vw, 4.6rem)',
              fontWeight: 600,
              lineHeight: 0.9,
              color: INK,
              opacity: 0.14,
              letterSpacing: '-0.04em',
            }}
          >
            {c.num}
          </span>
          <span className="flex items-baseline gap-1.5 px-4 py-2 rounded-full" style={{ background: INK }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 600, color: '#ECE6DA' }}>{c.points}</span>
            <span style={{ fontSize: '0.62rem', letterSpacing: '0.16em', color: '#B9B19D' }}>PTS</span>
          </span>
        </div>

        <p className="mb-2" style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: ACCENT }}>
          {c.num} / 06 · The Scoring Framework
        </p>

        <h3 className="font-semibold mb-6" style={{ fontSize: 'clamp(2.1rem, 5.5vw, 3.6rem)', letterSpacing: '-0.03em', lineHeight: 1.02, color: INK }}>
          {c.title}
        </h3>

        <div style={{ height: 2, width: 64, background: `linear-gradient(90deg, ${ACCENT}, transparent)`, marginBottom: '1.8rem' }} />

        <p className="font-medium mb-4" style={{ fontSize: 'clamp(1.15rem, 2.4vw, 1.6rem)', letterSpacing: '-0.01em', color: '#2A2A1F' }}>
          {c.question}
        </p>

        <p className="mb-8 max-w-2xl" style={{ fontSize: 'clamp(0.95rem, 1.6vw, 1.08rem)', lineHeight: 1.7, color: INK_2 }}>
          {c.explanation}
        </p>

        <div>
          <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8A7B4E', marginBottom: '0.4rem' }}>
            Rewards
          </p>
          <p style={{ fontSize: 'clamp(0.95rem, 1.6vw, 1.05rem)', lineHeight: 1.6, color: '#2A2A1F' }}>
            {c.rewards}
          </p>
        </div>
      </div>
    </div>
  )
}

export function ScoringStoryScroll() {
  return (
    <div className="relative">
      <div className="max-w-4xl mx-auto px-6 pt-28 pb-4 text-center">
        <p className="eyebrow mb-4" style={{ color: 'var(--accent)' }}>The Scoring Framework</p>
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text)', fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', letterSpacing: '-0.03em' }}>
          Six tests. One hundred points.
        </h2>
        <p className="leading-relaxed mx-auto max-w-xl mb-2" style={{ color: 'var(--text-2)', fontSize: '1rem' }}>
          Every stock runs through the same six tests. Keep scrolling. Each one is revealed in turn.
        </p>
      </div>

      <FlowArt aria-label="Stonky scoring framework">
        {CHAPTERS.map(c => (
          <FlowSection key={c.num} aria-label={`${c.title}, ${c.points} points`}>
            <ChapterCard c={c} />
          </FlowSection>
        ))}
      </FlowArt>
    </div>
  )
}
