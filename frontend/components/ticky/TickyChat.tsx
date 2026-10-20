'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { LoaderIcon } from 'lucide-react'

// Ask Ticky chat box. Plain-English input with a living emerald glow, a
// type-as-you-watch placeholder of example asks in Ticky's voice, and a row of
// human-sounding "hunches" (each shows a casual label but submits a keyword-rich
// query the matcher understands). Reports focus changes up so Ticky can react.

// label = what the user sees (casual, human); query = what gets sent to the
// deterministic matcher (keyword-rich so it resolves cleanly).
const HUNCHES: { label: string; query: string }[] = [
  { label: 'Find the next NVIDIA', query: 'stocks like NVDA' },
  { label: 'Safe and steady', query: 'low risk defensive ideas' },
  { label: 'Quiet compounders', query: 'quality compounders' },
  { label: 'Cheap tech, real upside', query: 'undervalued tech' },
  { label: 'Pays me to wait', query: 'dividend income stocks' },
  { label: "What's hot right now", query: 'high momentum names' },
  { label: 'Buy the dip', query: 'pullback opportunities' },
  { label: 'Hold-forever names', query: 'long-term winners' },
]

const EXAMPLES = [
  'Find me a stock like NVIDIA, but cheaper',
  'Something safe I can hold for years',
  'Tech that actually pays dividends',
  "Show me what's quietly compounding",
  'Beaten-down names worth a second look',
]

function useAutoResize(min: number, max: number) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const adjust = useCallback((reset?: boolean) => {
    const el = ref.current
    if (!el) return
    el.style.height = `${min}px`
    if (reset) return
    el.style.height = `${Math.max(min, Math.min(el.scrollHeight, max))}px`
  }, [min, max])
  useEffect(() => { if (ref.current) ref.current.style.height = `${min}px` }, [min])
  return { ref, adjust }
}

// Types example asks into the placeholder, holds, erases, moves on.
function useTypingPlaceholder(active: boolean) {
  const [ph, setPh] = useState(EXAMPLES[0])
  useEffect(() => {
    if (!active) { setPh(EXAMPLES[0]); return }
    let ex = 0, ci = 0, deleting = false, alive = true
    let timer: ReturnType<typeof setTimeout>
    const run = () => {
      if (!alive) return
      const full = EXAMPLES[ex]
      if (!deleting) {
        ci++
        setPh(full.slice(0, ci))
        if (ci >= full.length) { deleting = true; timer = setTimeout(run, 1700); return }
        timer = setTimeout(run, 46)
      } else {
        ci--
        setPh(full.slice(0, ci))
        if (ci <= 0) { deleting = false; ex = (ex + 1) % EXAMPLES.length; timer = setTimeout(run, 320); return }
        timer = setTimeout(run, 22)
      }
    }
    timer = setTimeout(run, 900)
    return () => { alive = false; clearTimeout(timer) }
  }, [active])
  return ph
}

interface TickyChatProps {
  onSubmit: (text: string) => void
  disabled?: boolean
  onFocusChange?: (focused: boolean) => void
}

export function TickyChat({ onSubmit, disabled, onFocusChange }: TickyChatProps) {
  const reduced = useReducedMotion()
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const { ref, adjust } = useAutoResize(58, 180)
  const typing = useTypingPlaceholder(!reduced && !value && !focused)
  const placeholder = (!value && !focused && !reduced) ? `${typing} ▌` : "Tell Ticky what you're after, in plain English"

  const submit = (text: string) => {
    const t = text.trim()
    if (!t || disabled) return
    onSubmit(t)
    setValue('')
    adjust(true)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(value) }
  }

  const setFocus = (f: boolean) => { setFocused(f); onFocusChange?.(f) }
  const ready = value.trim() && !disabled

  return (
    <div className="w-full max-w-xl">
      <div className="relative">
        {/* living emerald glow behind the box, breathing, brighter on focus */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-3 rounded-[26px]"
          style={{ background: 'radial-gradient(60% 80% at 50% 50%, rgba(46,148,102,0.42), transparent 75%)', filter: 'blur(16px)' }}
          animate={reduced ? { opacity: 0.4 } : { opacity: focused ? [0.65, 0.85, 0.65] : [0.32, 0.5, 0.32] }}
          transition={{ duration: focused ? 2.4 : 4.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className="relative rounded-2xl"
          initial={{ opacity: 0, y: 16, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: focused
              ? 'linear-gradient(180deg, rgba(38,50,44,0.96) 0%, rgba(22,30,26,0.98) 100%)'
              : 'linear-gradient(180deg, rgba(31,41,36,0.94) 0%, rgba(18,24,21,0.96) 100%)',
            border: `1px solid ${focused ? 'rgba(95,211,160,0.78)' : 'rgba(95,211,160,0.34)'}`,
            boxShadow: focused
              ? '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(63,176,124,0.25), 0 0 40px rgba(46,148,102,0.25), inset 0 1px 0 rgba(255,255,255,0.04)'
              : '0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
            backdropFilter: 'blur(14px)',
            transition: 'border-color 0.25s, box-shadow 0.25s',
          }}
        >
          <div className="p-3.5">
            <textarea
              ref={ref}
              value={value}
              onChange={e => { setValue(e.target.value); adjust() }}
              onKeyDown={onKeyDown}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              disabled={disabled}
              placeholder={placeholder}
              rows={1}
              className="w-full resize-none bg-transparent px-2 py-1.5 text-[0.98rem] leading-relaxed outline-none placeholder:text-[#93A69C] disabled:opacity-60"
              style={{ color: 'var(--text)', overflow: 'hidden' }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 border-t px-3.5 py-2.5" style={{ borderColor: 'rgba(95,211,160,0.20)' }}>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              Say it how you&apos;d say it to a friend.
            </span>
            <motion.button
              type="button"
              onClick={() => submit(value)}
              disabled={!ready}
              whileHover={ready ? { scale: 1.03 } : undefined}
              whileTap={ready ? { scale: 0.97 } : undefined}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
              style={
                ready
                  ? { background: 'linear-gradient(180deg, #3FB07C 0%, #2E9466 100%)', color: '#06140d', boxShadow: '0 8px 22px rgba(46,148,102,0.4)' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'var(--muted)' }
              }
            >
              {disabled ? <LoaderIcon className="h-4 w-4 animate-[spin_1.4s_linear_infinite]" /> : <span aria-hidden>↳</span>}
              <span>{disabled ? 'On it' : 'Ask Ticky'}</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Ticky's hunches — casual labels, keyword queries underneath */}
      <p className="mb-2.5 mt-5 text-center text-[0.7rem] uppercase tracking-[0.2em]" style={{ color: 'rgba(159,217,188,0.55)' }}>
        or chase one of Ticky&apos;s hunches
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {HUNCHES.map((h, i) => (
          <motion.button
            key={h.label}
            type="button"
            disabled={disabled}
            onClick={() => submit(h.query)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05, duration: 0.3 }}
            whileHover={!disabled ? { scale: 1.04, y: -2 } : undefined}
            whileTap={!disabled ? { scale: 0.96 } : undefined}
            className="rounded-full px-3.5 py-1.5 text-[0.8rem] font-medium transition-colors disabled:opacity-50"
            style={{ background: 'rgba(63,176,124,0.07)', border: '1px solid rgba(63,176,124,0.18)', color: '#A9E0C4' }}
            onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = 'rgba(63,176,124,0.16)'; e.currentTarget.style.borderColor = 'rgba(63,176,124,0.4)' } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(63,176,124,0.07)'; e.currentTarget.style.borderColor = 'rgba(63,176,124,0.18)' }}
          >
            {h.label}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
