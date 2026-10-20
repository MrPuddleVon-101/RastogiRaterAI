'use client'
import { useEffect } from 'react'
import Lenis from 'lenis'

// Premium smooth scroll for the landing page only. Lenis virtualizes the wheel
// with gentle inertia (not floaty, not scroll-hijacking) and runs its own RAF
// loop. Disabled under reduced motion. Cleans up fully on unmount so the report
// and discover pages keep native / their own scrolling. The instance is parked
// on window so the navbar and CTA can drive buttery anchor scrolls.
export function LandingSmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // REFRESH FIX: the browser (and bfcache) otherwise restores the previous
    // scroll position on reload, which — combined with Lenis + the tall pinned
    // track — drops the user into the middle of the page instead of the hero.
    // Take manual control and force the top before anything else initializes.
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    // No deep-dive link in this branch (those open the report), so always reset.
    if (!window.location.hash) window.scrollTo(0, 0)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    })
    ;(window as unknown as { __lenis?: Lenis }).__lenis = lenis
    // Lenis snapshots scroll on construction; pin it to the top immediately so a
    // restored offset can never leak through on the first frame.
    lenis.scrollTo(0, { immediate: true, force: true })

    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      delete (window as unknown as { __lenis?: Lenis }).__lenis
    }
  }, [])

  return null
}

// Smoothly scroll to the top (the hero / search), via Lenis when available.
export function scrollToTop() {
  const lenis = (window as unknown as { __lenis?: Lenis }).__lenis
  if (lenis) lenis.scrollTo(0, { duration: 1.1 })
  else window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Smoothly scroll an element into view by id, offset clears the floating navbar.
export function scrollToId(id: string, offset = -16) {
  const el = document.getElementById(id)
  if (!el) return
  const lenis = (window as unknown as { __lenis?: Lenis }).__lenis
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.1 })
  else el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
