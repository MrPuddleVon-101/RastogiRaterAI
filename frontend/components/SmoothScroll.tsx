'use client'
import { useEffect } from 'react'

// Subtle premium smooth scrolling for the report page only. Lerps the window
// scroll toward a wheel-driven target (natural, not floaty). It bails out
// generously so it never fights the chart, fullscreen mode, dropdowns, modals,
// inputs, or any inner scrollable: when body scroll is locked, over fixed
// overlays / charts / form controls, or over an inner element that can itself
// scroll in the wheel direction, the native wheel is left untouched. Disabled on
// touch devices and under prefers-reduced-motion. Mounts only while the report
// is shown; unmounting fully restores native scrolling.

export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(pointer: coarse)').matches) return

    let target = window.scrollY
    let current = window.scrollY
    let raf = 0
    let active = false

    const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight)

    const tick = () => {
      current += (target - current) * 0.14
      if (Math.abs(target - current) < 0.4) {
        current = target
        window.scrollTo(0, Math.round(current))
        active = false
        return
      }
      window.scrollTo(0, Math.round(current))
      raf = requestAnimationFrame(tick)
    }

    const shouldBail = (e: WheelEvent): boolean => {
      if (e.ctrlKey) return true // pinch zoom
      // any modal / fullscreen that locked the page scroll
      if (document.body.style.overflow === 'hidden') return true
      let el = e.target as HTMLElement | null
      while (el && el !== document.body && el !== document.documentElement) {
        if (el.matches?.('input, textarea, select, [contenteditable="true"], [data-no-smooth], [role="dialog"], [role="listbox"], [role="menu"], canvas, svg, .recharts-wrapper, .recharts-surface')) return true
        const cs = getComputedStyle(el)
        if (cs.position === 'fixed') return true // fixed overlays (fullscreen, portals)
        const oy = cs.overflowY
        if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
          const canScroll = e.deltaY < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight - 1
          if (canScroll) return true
        }
        el = el.parentElement
      }
      return false
    }

    const onWheel = (e: WheelEvent) => {
      if (shouldBail(e)) return
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY
      if (Math.abs(delta) < 1) return
      e.preventDefault()
      if (!active) { current = window.scrollY; target = window.scrollY }
      target = Math.min(maxScroll(), Math.max(0, target + delta))
      active = true
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(tick)
    }

    // if the user scrolls some other way (keyboard, scrollbar, anchor jump),
    // adopt that position so the next wheel starts from the right place.
    const onScroll = () => { if (!active) { current = window.scrollY; target = window.scrollY } }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return null
}
