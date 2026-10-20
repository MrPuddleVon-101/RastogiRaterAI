'use client'
import { useEffect } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'

// Benjamin Franklin (left) and Warren Buffett (right) engraved softly into the
// dark grid like background financial-symbol portraits. The source photos have
// torn-paper rips baked into their edges, so each face is zoomed in (scale 1.45)
// onto the clean face region and revealed through a tight, soft radial mask that
// fades to nothing long before any torn edge could appear. Slow parallax drift
// + fade on scroll gives the hero depth. Decorative only.
export function HeroPortraits() {
  const reduced = useReducedMotion()
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 600], [0, 80])
  const fade = useTransform(scrollY, [0, 500], [1, 0])

  // Cursor parallax: the portraits drift gently AWAY from the pointer, at
  // different magnitudes, so the hero reads as layered depth instead of a flat
  // backdrop. Springs keep it heavy and slow; disabled under reduced motion.
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const franklinX = useSpring(useTransform(mx, [-0.5, 0.5], [14, -14]), { stiffness: 50, damping: 18 })
  const franklinY = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), { stiffness: 50, damping: 18 })
  const buffettX = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 50, damping: 18 })
  const buffettY = useSpring(useTransform(my, [-0.5, 0.5], [-6, 6]), { stiffness: 50, damping: 18 })

  useEffect(() => {
    if (reduced) return
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      mx.set(e.clientX / window.innerWidth - 0.5)
      my.set(e.clientY / window.innerHeight - 0.5)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reduced, mx, my])

  // Franklin's source (2.png) has torn-paper rips baked across the TOP and
  // BOTTOM of the crop. A vertically tight ellipse (52% tall) fades those bands
  // to nothing while still showing the eyes/nose/mouth, and a hard top+bottom
  // linear fade composited on top guarantees no white streak can ever reach the
  // frame. He is zoomed in enough (scale 1.36) that the rips sit near the edges
  // the mask kills.
  const maskFranklin =
    'radial-gradient(ellipse 60% 52% at 50% 47%, #000 0%, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.28) 64%, transparent 78%), linear-gradient(180deg, transparent 0%, #000 22%, #000 74%, transparent 100%)'

  // Buffett (1.png) is a clean portrait, so a softer, taller ellipse keeps his
  // whole face readable.
  const maskBuffett =
    'radial-gradient(ellipse 60% 64% at 50% 48%, #000 0%, rgba(0,0,0,0.86) 46%, rgba(0,0,0,0.3) 70%, transparent 84%)'

  // The portrait layer itself. next/image serves AVIF/WebP at the requested
  // width instead of the raw ~700KB PNGs these used to be as CSS backgrounds.
  const inner: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    transformOrigin: 'center',
  }

  return (
    <motion.div
      aria-hidden
      className="absolute inset-0 z-[1] pointer-events-none overflow-hidden"
      style={{ y: reduced ? 0 : y, opacity: reduced ? 1 : fade }}
    >
      {/* Franklin, left. Zoomed out from the old tight eye-crop and lifted a
          touch so his brow, glasses-less gaze and high forehead read as the
          $100 portrait, not an abstract texture. Minimal blur keeps the
          identity; opacity keeps him a background presence. */}
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 1.06 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        className="absolute left-0 top-0 bottom-0 hidden md:block overflow-hidden"
        style={{
          width: 'clamp(340px, 42vw, 640px)',
          x: reduced ? 0 : franklinX,
          y: reduced ? 0 : franklinY,
          maskImage: maskFranklin,
          WebkitMaskImage: maskFranklin,
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in',
        }}
      >
        <div style={{ ...inner, transform: 'scale(1.28)', filter: 'grayscale(1) contrast(1.14) brightness(0.95)' }}>
          <Image
            src="/LandingPagePics/2.png"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 840px"
            style={{ objectFit: 'cover', objectPosition: 'center 46%' }}
          />
        </div>
      </motion.div>

      {/* Buffett, right. Kept clearly recognizable: light blur, comfortable
          framing on his face. */}
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 1.06 }}
        animate={{ opacity: 0.24, scale: 1 }}
        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1], delay: 0.45 }}
        className="absolute right-0 top-0 bottom-0 hidden md:block overflow-hidden"
        style={{ width: 'clamp(340px, 42vw, 640px)', x: reduced ? 0 : buffettX, y: reduced ? 0 : buffettY, maskImage: maskBuffett, WebkitMaskImage: maskBuffett }}
      >
        <div style={{ ...inner, transform: 'scale(1.32)', filter: 'grayscale(1) contrast(1.06) brightness(0.86) blur(0.5px)' }}>
          <Image
            src="/LandingPagePics/1.png"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 840px"
            style={{ objectFit: 'cover', objectPosition: 'center 52%' }}
          />
        </div>
      </motion.div>

      {/* Gentle center darkener. The hero UI now sits on its own layer above
          this, so this only seats the portraits into the grid; it must stay
          light enough that the faces still read. */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(58% 56% at 50% 42%, rgba(7,7,9,0.55) 0%, rgba(7,7,9,0.18) 54%, rgba(7,7,9,0) 80%)' }}
      />
      {/* Floor fade seats them into the page */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: 'linear-gradient(180deg, transparent, var(--bg))' }}
      />
    </motion.div>
  )
}
