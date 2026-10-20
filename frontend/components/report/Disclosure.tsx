'use client'
import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ChevronDown } from 'lucide-react'

/**
 * A collapsible report section.
 *
 * The report used to render every layer at once: chart, score anatomy,
 * valuation model, and all 23 metric rows, about 1,200 words before the reader
 * had decided whether they cared. That is the "you're wasting my time"
 * problem. The verdict now answers the question on its own, and each deeper
 * layer sits behind one of these, labelled with what it holds and how big it
 * is, so opening one is a deliberate choice rather than a wall.
 *
 * Content is unmounted while closed, so collapsed sections cost nothing.
 */

interface DisclosureProps {
  title: string
  /** What is inside, in a few words. Shown next to the title. */
  summary?: string
  /** e.g. "23 metrics". Sets expectations before the reader commits. */
  count?: string
  /** Accent for the rule and marker. */
  tone?: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export function Disclosure({
  title,
  summary,
  count,
  tone = 'var(--brand)',
  defaultOpen = false,
  children,
}: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen)
  const reduced = useReducedMotion()
  const id = useId()

  return (
    <section
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: open
          ? 'linear-gradient(180deg, var(--surface-2) 0%, var(--surface) 100%)'
          : 'linear-gradient(180deg, rgba(23,26,33,0.72) 0%, rgba(16,18,22,0.72) 100%)',
        border: `1px solid ${open ? 'var(--border-3)' : 'var(--border-2)'}`,
        boxShadow: open ? 'var(--raise-2)' : 'var(--raise-1)',
        transition: 'background 280ms ease, border-color 280ms ease, box-shadow 280ms ease',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="group flex w-full items-center gap-4 px-5 py-4 text-left sm:px-6"
      >
        {/* colour marker, lit when open */}
        <span
          aria-hidden
          className="h-8 w-[3px] shrink-0 rounded-full"
          style={{
            background: open ? tone : 'var(--border-3)',
            boxShadow: open ? `0 0 14px ${tone}` : 'none',
            transition: 'background 280ms ease, box-shadow 280ms ease',
          }}
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.015em' }}>
              {title}
            </span>
            {count && (
              <span
                className="t-num rounded-full px-2 py-0.5"
                style={{ fontSize: '0.66rem', color: tone, background: 'rgba(255,255,255,0.06)' }}
              >
                {count}
              </span>
            )}
          </span>
          {summary && (
            <span className="mt-0.5 block" style={{ fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.5 }}>
              {summary}
            </span>
          )}
        </span>
        <motion.span
          aria-hidden
          className="shrink-0"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduced ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ color: open ? tone : 'var(--muted)' }}
        >
          <ChevronDown size={18} strokeWidth={2.4} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            key="body"
            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0.15 : 0.44, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-6 sm:px-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
