'use client'
import { useEffect, useRef } from 'react'
import createGlobe from 'cobe'

// A dark, premium dotted-continent globe (cobe), styled in Stonky emerald, with
// glowing market nodes on the world's financial hubs. Real landmasses — not a
// plain sphere. Sized square to its container and auto-rotating. Loaded ssr:false.

// [lat, lng] of major exchanges / financial centres -> glowing nodes.
const HUBS: [number, number, number][] = [
  [40.71, -74.0, 0.06], // New York
  [51.51, -0.13, 0.05], // London
  [50.11, 8.68, 0.04], // Frankfurt
  [35.68, 139.69, 0.05], // Tokyo
  [22.32, 114.17, 0.045], // Hong Kong
  [31.23, 121.47, 0.045], // Shanghai
  [1.35, 103.82, 0.04], // Singapore
  [-33.87, 151.21, 0.04], // Sydney
  [19.08, 72.88, 0.04], // Mumbai
  [-23.55, -46.63, 0.04], // São Paulo
  [25.2, 55.27, 0.035], // Dubai
  [43.65, -79.38, 0.035], // Toronto
]

export default function TacticalGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    let phi = 0
    let size = 0
    let globe: { destroy: () => void } | null = null
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const build = () => {
      const s = Math.round(Math.min(wrap.clientWidth, wrap.clientHeight))
      if (s < 10 || (Math.abs(s - size) < 2 && globe)) return
      size = s
      if (globe) globe.destroy()
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: size * dpr,
        height: size * dpr,
        phi: 0,
        theta: 0.26,
        dark: 1,
        diffuse: 1.15,
        mapSamples: 16000,
        mapBrightness: 5.4,
        baseColor: [0.1, 0.13, 0.12],
        markerColor: [0.37, 0.75, 0.54],
        glowColor: [0.05, 0.16, 0.11],
        markers: HUBS.map(([lat, lng, sz]) => ({ location: [lat, lng], size: sz })),
        onRender: (state) => {
          state.phi = phi
          phi += 0.0032
          state.width = size * dpr
          state.height = size * dpr
        },
      })
      canvas.style.width = `${size}px`
      canvas.style.height = `${size}px`
    }

    const teardown = () => {
      if (globe) { globe.destroy(); globe = null; size = 0 }
    }

    // cobe drives its own rAF and keeps drawing a 16k-sample sphere for as
    // long as it exists, on-screen or not. This globe lives far down the page,
    // so left unguarded it burned frames through the entire hero. Build it
    // only while it is actually near the viewport, and tear it down again on
    // the way out.
    let visible = false
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting === visible) return
        visible = entry.isIntersecting
        if (visible) build()
        else teardown()
      },
      { rootMargin: '200px' },
    )
    io.observe(wrap)

    const ro = new ResizeObserver(() => { if (visible) build() })
    ro.observe(wrap)
    // sticky/off-screen containers can measure late; nudge once after layout
    const t = setTimeout(() => { if (visible) build() }, 250)

    return () => {
      io.disconnect()
      ro.disconnect()
      clearTimeout(t)
      teardown()
    }
  }, [])

  return (
    <div ref={wrapRef} className="absolute inset-0 flex items-center justify-center">
      <canvas ref={canvasRef} style={{ width: 0, height: 0, contain: 'layout paint size' }} />
    </div>
  )
}
