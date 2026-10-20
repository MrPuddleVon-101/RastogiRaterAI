'use client'
import { useRef } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react'

interface ImageDepthCardProps {
  src: string
  /** background-position for the image plane. */
  position?: string
  /** 'cover' fills the frame; 'contain' shows the full plate on a dark mat. */
  fit?: 'cover' | 'contain'
  /** short mono kicker above the caption. */
  kicker?: string
  caption?: string
  filter?: string
  className?: string
  aspect?: string
  /** Layout hint for the optimizer. These cards are at most ~520px wide. */
  sizes?: string
  /** Describe the picture. Empty string marks it decorative. */
  alt?: string
}

// An editorial image treated as a physical object: the card tilts toward the
// cursor (soft springs, max ~5deg), the image plane inside counter-drifts so
// the frame reads as depth, and a specular sheen follows the pointer across
// the surface. Touch and reduced-motion get the static editorial frame.
export function ImageDepthCard({
  src,
  position = 'center',
  fit = 'cover',
  kicker,
  caption,
  filter = 'grayscale(0.35) contrast(1.06) brightness(0.85)',
  className = '',
  aspect = '4 / 5',
  sizes = '(max-width: 768px) 92vw, 520px',
  alt = '',
}: ImageDepthCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  // pointer position within the card, -0.5..0.5
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 160, damping: 20, mass: 0.4 })
  const sy = useSpring(py, { stiffness: 160, damping: 20, mass: 0.4 })

  const rotateY = useTransform(sx, [-0.5, 0.5], [-5.5, 5.5])
  const rotateX = useTransform(sy, [-0.5, 0.5], [4.5, -4.5])
  // the image plane counter-drifts a touch: foreground glass, midground image
  const imgX = useTransform(sx, [-0.5, 0.5], [8, -8])
  const imgY = useTransform(sy, [-0.5, 0.5], [6, -6])
  // pointer-following sheen
  const sheenX = useTransform(sx, [-0.5, 0.5], ['20%', '80%'])
  const sheenY = useTransform(sy, [-0.5, 0.5], ['15%', '85%'])
  const sheen = useTransform(
    [sheenX, sheenY],
    ([xv, yv]) => `radial-gradient(300px circle at ${xv} ${yv}, rgba(255,255,255,0.08), transparent 60%)`,
  )

  const onMove = (e: React.PointerEvent) => {
    if (reduced || e.pointerType === 'touch' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width - 0.5)
    py.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onLeave = () => { px.set(0); py.set(0) }

  return (
    <div style={{ perspective: 1100 }} className={className}>
      <motion.figure
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="relative overflow-hidden rounded-3xl"
        style={{
          aspectRatio: aspect,
          rotateX: reduced ? 0 : rotateX,
          rotateY: reduced ? 0 : rotateY,
          transformStyle: 'preserve-3d',
          border: '1px solid var(--border-2)',
          background: 'radial-gradient(120% 120% at 50% 0%, #14151a 0%, #07070a 74%)',
          boxShadow: '0 40px 90px rgba(0,0,0,0.55)',
        }}
      >
        {/* image plane (oversized so the counter-drift never reveals edges) */}
        <motion.div
          className="absolute"
          style={{
            inset: fit === 'cover' ? '-5%' : '0',
            x: reduced ? 0 : imgX,
            y: reduced ? 0 : imgY,
            filter,
          }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            style={{ objectFit: fit, objectPosition: position }}
          />
        </motion.div>
        {/* pointer sheen */}
        {!reduced && (
          <motion.div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: sheen }} />
        )}
        {/* legibility floor */}
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(7,7,10,0) 58%, rgba(7,7,10,0.88) 100%)' }} />
        {(kicker || caption) && (
          <figcaption className="absolute bottom-0 left-0 right-0 p-5">
            {kicker && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#5FBF8A', letterSpacing: '0.18em' }}>{kicker}</p>}
            {caption && <p className="mt-1.5 text-sm sm:text-[0.95rem] font-medium max-w-[26ch]" style={{ color: 'var(--text)', lineHeight: 1.45 }}>{caption}</p>}
          </figcaption>
        )}
      </motion.figure>
    </div>
  )
}
