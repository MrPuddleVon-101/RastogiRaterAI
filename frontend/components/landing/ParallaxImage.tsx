'use client'
import { useRef } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react'

interface ParallaxImageProps {
  src: string
  /** background-position, e.g. 'center 30%'. */
  position?: string
  /** grayscale/brightness treatment for editorial consistency. */
  filter?: string
  /** Strength of the vertical drift in percent. */
  amount?: number
  className?: string
  /** Optional dark gradient overlay for text legibility. */
  overlay?: string
  children?: React.ReactNode
  rounded?: number
  /** Subtle zoom on hover for editorial image cards. */
  interactive?: boolean
  /** Layout hint for the optimizer. Defaults to a full-bleed band. */
  sizes?: string
  /** Set on the one block that is above the fold. */
  priority?: boolean
  /** Describe the picture. Empty string marks it decorative. */
  alt?: string
}

// A masked, cinematic image block that drifts slightly against the scroll for
// depth. Respects reduced motion (renders static). Used throughout the story.
export function ParallaxImage({
  src,
  position = 'center',
  filter = 'grayscale(0.4) contrast(1.04) brightness(0.82)',
  amount = 8,
  className = '',
  overlay,
  children,
  rounded = 20,
  interactive = false,
  sizes = '100vw',
  priority = false,
  alt = '',
}: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [`-${amount}%`, `${amount}%`])

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden ${interactive ? 'lp-sheen' : ''} ${className}`}
      style={{ borderRadius: rounded, border: '1px solid var(--border-2)' }}
    >
      <motion.div
        className={interactive ? 'transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]' : ''}
        style={{
          position: 'absolute',
          inset: `-${amount + 4}% 0`,
          y: reduced ? 0 : y,
          filter,
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          style={{ objectFit: 'cover', objectPosition: position }}
        />
      </motion.div>
      {overlay && <div className="absolute inset-0" style={{ background: overlay }} />}
      {children && <div className="relative z-10 h-full">{children}</div>}
    </div>
  )
}
