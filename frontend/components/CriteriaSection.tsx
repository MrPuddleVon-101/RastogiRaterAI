'use client'
import { useRef } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'

interface Criterion {
  index: string
  title: string
  points: number
  question: string
  explanation: string
  depth: number
}

const CRITERIA: Criterion[] = [
  {
    index: '01', title: 'Valuation', points: 20,
    question: 'Is the price asking too much?',
    explanation: 'Checks how much investors are paying for earnings, sales, and assets.',
    depth: 0.9,
  },
  {
    index: '02', title: 'Analyst Expectations', points: 15,
    question: 'Do analysts see upside?',
    explanation: 'Reads professional estimates as a signal, not as proof.',
    depth: 0.5,
  },
  {
    index: '03', title: 'Profitability', points: 20,
    question: 'Does revenue become real profit?',
    explanation: 'Checks whether the company actually keeps money after costs.',
    depth: 1.0,
  },
  {
    index: '04', title: 'Cash Flow & Debt', points: 20,
    question: 'Is there cash behind the story?',
    explanation: 'Looks for real cash generation and manageable obligations.',
    depth: 0.65,
  },
  {
    index: '05', title: 'Technical Position', points: 15,
    question: 'Has the chart cooled or cracked?',
    explanation: 'Checks whether the stock has pulled back cleanly or broken down.',
    depth: 0.85,
  },
  {
    index: '06', title: 'Data Confidence', points: 10,
    question: 'How complete is the evidence?',
    explanation: 'Measures how much usable data supports the score.',
    depth: 0.45,
  },
]

// vertical offset per column to break the flat grid
const COL_OFFSET = [0, 34, 14]

function Card({
  item, i, mx, my,
}: {
  item: Criterion
  i: number
  mx: MotionValue<number>
  my: MotionValue<number>
}) {
  const tx = useTransform(mx, [-1, 1], [-18 * item.depth, 18 * item.depth])
  const ty = useTransform(my, [-1, 1], [-12 * item.depth, 12 * item.depth])
  const rotX = useTransform(my, [-1, 1], [3.5, -3.5])
  const rotY = useTransform(mx, [-1, 1], [-3.5, 3.5])
  const widthPct = Math.round((item.points / 20) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
      style={{
        marginTop: COL_OFFSET[i % 3],
        x: tx,
        y: ty,
        rotateX: rotX,
        rotateY: rotY,
        transformStyle: 'preserve-3d',
        background: 'linear-gradient(165deg, var(--surface-3) 0%, var(--surface) 70%)',
        borderRadius: 18,
        boxShadow: 'var(--shadow-md)',
        padding: '1.6rem 1.5rem 1.4rem',
      }}
      className="relative flex flex-col gap-3"
      whileHover={{ y: -6 }}
    >
      {/* index + weight badge */}
      <div className="flex items-start justify-between">
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--faint)',
            letterSpacing: '0.1em',
          }}
        >
          {item.index}
        </span>
        <span
          className="flex items-baseline gap-1 px-2.5 py-1 rounded-full"
          style={{ background: 'var(--accent-bg)' }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--accent-2)',
            }}
          >
            {item.points}
          </span>
          <span style={{ fontSize: '0.58rem', color: 'var(--accent)', letterSpacing: '0.12em' }}>
            PTS
          </span>
        </span>
      </div>

      <div className="mt-1">
        <p className="eyebrow mb-2" style={{ color: 'var(--accent)' }}>
          {item.title}
        </p>
        <p
          className="font-medium leading-snug mb-2"
          style={{ color: 'var(--text)', fontSize: '1.06rem', letterSpacing: '-0.01em' }}
        >
          {item.question}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
          {item.explanation}
        </p>
      </div>

      {/* weight sliver: shows this category's share of the system */}
      <div className="mt-auto pt-3">
        <div
          className="h-[3px] rounded-full overflow-hidden"
          style={{ background: 'var(--surface-3)' }}
        >
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${widthPct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.3 + i * 0.08, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
              opacity: 0.7,
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}

export function CriteriaSection() {
  const ref = useRef<HTMLDivElement>(null)
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const mx = useSpring(rawX, { damping: 34, stiffness: 90 })
  const my = useSpring(rawY, { damping: 34, stiffness: 90 })

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    rawX.set((e.clientX - r.left - r.width / 2) / (r.width / 2))
    rawY.set((e.clientY - r.top - r.height / 2) / (r.height / 2))
  }
  const onLeave = () => { rawX.set(0); rawY.set(0) }

  return (
    <section className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 max-w-2xl"
        >
          <p className="eyebrow mb-4" style={{ color: 'var(--accent)' }}>The Scoring Framework</p>
          <h2
            className="font-semibold leading-tight mb-4"
            style={{ color: 'var(--text)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', letterSpacing: '-0.03em' }}
          >
            Six tests. One hundred points.
          </h2>
          <p className="leading-relaxed" style={{ color: 'var(--text-2)', fontSize: '1rem' }}>
            Every stock is run through the same six dimensions. Each one isolates a different
            way the story can hold up, or fall apart.
          </p>
        </motion.div>

        <div
          ref={ref}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          style={{ perspective: 1100 }}
        >
          {CRITERIA.map((item, i) => (
            <Card key={item.index} item={item} i={i} mx={mx} my={my} />
          ))}
        </div>
      </div>
    </section>
  )
}
