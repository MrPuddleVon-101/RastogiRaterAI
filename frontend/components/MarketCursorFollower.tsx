'use client'
import { useEffect, useRef, useState } from 'react'

// A market-signal cursor trail: a smooth, tapering comet ribbon behind the
// pointer, in the restrained Stonky palette. Rebuilt from the old 21st.dev
// filled-polygon follower, which flickered: it FILLED an open self-crossing
// path and mutated point age twice per frame in its mirror loop, so fast
// flicks produced glitchy bowtie shapes. This version:
//  - samples at most one point per animation frame (stable density at any
//    event rate, no pile-ups on coalesced pointermove)
//  - draws layered STROKES through quadratic midpoints (always smooth, no
//    fill, nothing to self-intersect)
//  - trails expire by age with an eased tail, so stopping never wobbles
//  - width breathes with cursor speed (calm drift = hairline, fast flick =
//    charged streak)
//  - sparks use WAAPI (element.animate), no CSS-transition timing races
// Fixed overlay, pointer-events: none, disabled on touch / reduced motion.

interface Pt { x: number; y: number; t: number }

interface MarketCursorFollowerProps {
  /** full: home/discover. calm: report (thinner, quieter, no sparks). */
  intensity?: 'full' | 'calm'
}

interface Layer {
  el: SVGPathElement
  /** trail lifetime in ms (longer = longer tail) */
  ttl: number
  /** stroke width multiplier */
  w: number
}

function buildPath(pts: Pt[]): string {
  if (pts.length < 2) return ''
  // Quadratic smoothing through midpoints: M mid0 ... Q p[i] mid(i,i+1)
  const d: string[] = []
  const mx = (a: Pt, b: Pt) => `${(a.x + b.x) / 2} ${(a.y + b.y) / 2}`
  d.push(`M ${pts[0].x} ${pts[0].y}`)
  d.push(`L ${mx(pts[0], pts[1])}`)
  for (let i = 1; i < pts.length - 1; i++) {
    d.push(`Q ${pts[i].x} ${pts[i].y} ${mx(pts[i], pts[i + 1])}`)
  }
  const last = pts[pts.length - 1]
  d.push(`L ${last.x} ${last.y}`)
  return d.join(' ')
}

export function MarketCursorFollower({ intensity = 'full' }: MarketCursorFollowerProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setEnabled(!coarse && !reduced)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const svg = svgRef.current
    if (!svg) return

    const calm = intensity === 'calm'
    const NS = 'http://www.w3.org/2000/svg'

    // Layered comet: a faint wide teal aura, the ivory core, a short gold tip.
    const spec = calm
      ? [{ color: 'rgba(236,230,218,0.26)', ttl: 260, w: 1.6 }]
      : [
          { color: 'rgba(96,138,132,0.20)', ttl: 460, w: 4.6 },
          { color: 'rgba(236,230,218,0.5)', ttl: 380, w: 1.9 },
          { color: 'rgba(220,190,110,0.4)', ttl: 150, w: 1.0 },
        ]

    const layers: Layer[] = spec.map(s => {
      const el = document.createElementNS(NS, 'path')
      el.setAttribute('fill', 'none')
      el.setAttribute('stroke', s.color)
      el.setAttribute('stroke-linecap', 'round')
      el.setAttribute('stroke-linejoin', 'round')
      svg.appendChild(el)
      return { el, ttl: s.ttl, w: s.w }
    })

    const resize = () => {
      svg.setAttribute('width', String(window.innerWidth))
      svg.setAttribute('height', String(window.innerHeight))
    }
    resize()
    window.addEventListener('resize', resize)

    // Latest pointer position; sampled once per frame in the rAF loop.
    let px = -1
    let py = -1
    let hasPointer = false
    let speed = 0 // smoothed px/frame, drives width + sparks
    const pts: Pt[] = [] // newest first
    const maxTtl = Math.max(...layers.map(l => l.ttl))

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      px = e.clientX
      py = e.clientY
      hasPointer = true
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    const spark = (x: number, y: number, vx: number, vy: number) => {
      const c = document.createElementNS(NS, 'circle')
      const r = Math.min(1.2 + speed * 0.06, 2.6)
      c.setAttribute('r', String(r))
      c.setAttribute('fill', Math.random() < 0.5 ? 'rgba(236,230,218,0.7)' : 'rgba(201,162,76,0.6)')
      c.setAttribute('cx', String(x))
      c.setAttribute('cy', String(y))
      svg.appendChild(c)
      const jitter = () => (Math.random() - 0.5) * 30
      const anim = c.animate(
        [
          { transform: 'translate(0px, 0px) scale(1)', opacity: 1 },
          { transform: `translate(${vx * 6 + jitter()}px, ${vy * 6 + jitter()}px) scale(0)`, opacity: 0 },
        ],
        { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      )
      anim.onfinish = () => { if (svg.contains(c)) svg.removeChild(c) }
    }

    let raf = 0
    let lastSpark = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const now = performance.now()

      if (hasPointer) {
        const head = pts[0]
        const dx = head ? px - head.x : 0
        const dy = head ? py - head.y : 0
        const dist = head ? Math.hypot(dx, dy) : 0
        speed += ((head ? dist : 0) - speed) * 0.2

        // Sample only when the pointer actually moved: an idle cursor keeps a
        // still, shrinking tail instead of a wobbling knot.
        if (!head || dist > 1.5) {
          pts.unshift({ x: px, y: py, t: now })
          if (pts.length > 42) pts.length = 42
          // charged flicks shed the occasional spark
          if (!calm && speed > 14 && now - lastSpark > 90 && Math.random() < 0.4) {
            lastSpark = now
            spark(px, py, dx / (dist || 1), dy / (dist || 1))
          }
        }
      }

      // expire old points
      while (pts.length && now - pts[pts.length - 1].t > maxTtl) pts.pop()

      for (const layer of layers) {
        // each layer draws only the points young enough for its own tail
        let n = pts.length
        while (n > 0 && now - pts[n - 1].t > layer.ttl) n--
        const slice = pts.slice(0, n)
        layer.el.setAttribute('d', buildPath(slice))
        const w = layer.w * (0.7 + Math.min(speed * 0.045, 1.3))
        layer.el.setAttribute('stroke-width', String(w))
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
      layers.forEach(l => { if (svg.contains(l.el)) svg.removeChild(l.el) })
    }
  }, [enabled, intensity])

  if (!enabled) return null

  return (
    <div
      aria-hidden
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: 5, pointerEvents: 'none' }}
    >
      <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" className="absolute inset-0" />
    </div>
  )
}
