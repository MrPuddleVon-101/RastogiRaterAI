'use client'
import { Fragment } from 'react'
import { motion, useReducedMotion } from 'motion/react'

// Headline that resolves word-by-word: each word rises and unblurs on a small
// stagger as it scrolls into view. Used for the big editorial statements so the
// copy feels authored, not pasted. `as` lets the caller pick the tag; styling
// is passed straight through.
export function WordReveal({
  text,
  className,
  style,
  as: Tag = 'h2',
  delay = 0,
  highlight,
  highlightColor = '#5FBF8A',
}: {
  text: string
  className?: string
  style?: React.CSSProperties
  as?: keyof React.JSX.IntrinsicElements
  delay?: number
  /** Words (case-sensitive, punctuation-stripped) to paint in the accent color. */
  highlight?: string[]
  highlightColor?: string
}) {
  const reduced = useReducedMotion()
  const words = text.split(' ')
  const isHot = (w: string) => highlight?.some(h => w.replace(/[.,!?]/g, '') === h)

  const MotionTag = motion[Tag as 'h2']

  return (
    <MotionTag
      className={className}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-90px' }}
      transition={{ staggerChildren: reduced ? 0 : 0.05, delayChildren: delay }}
    >
      {words.map((w, i) => (
        // The real space lives BETWEEN the word boxes as its own text node, never
        // inside the overflow-hidden mask (where it would be clipped and run the
        // words together).
        <Fragment key={i}>
          <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
            <motion.span
              style={{ display: 'inline-block', color: isHot(w) ? highlightColor : undefined }}
              variants={{
                hidden: reduced ? { opacity: 0 } : { opacity: 0, y: '0.5em', filter: 'blur(6px)' },
                show: { opacity: 1, y: 0, filter: 'blur(0px)' },
              }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </MotionTag>
  )
}
