'use client'

import { useEffect, useRef } from 'react'

/**
 * A restrained cursor spotlight. Muted slate, sits behind content, and follows
 * the pointer with eased motion. Disabled on small screens. Uses direct style
 * writes inside rAF (no React state churn) so it stays smooth and cheap.
 */
const SpotlightBackground = () => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(max-width: 640px)').matches) return

    let raf = 0
    let tx = window.innerWidth / 2
    let ty = window.innerHeight / 3
    let cx = tx
    let cy = ty

    const onMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY }
    const tick = () => {
      cx += (tx - cx) * 0.1
      cy += (ty - cy) * 0.1
      if (ref.current) ref.current.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
      <div
        ref={ref}
        className="absolute rounded-full"
        style={{
          left: 0,
          top: 0,
          width: 480,
          height: 480,
          background:
            'radial-gradient(circle, rgba(108,150,162,0.32) 0%, rgba(96,132,146,0.14) 36%, transparent 72%)',
          filter: 'blur(24px)',
        }}
      />
    </div>
  )
}

export default SpotlightBackground
