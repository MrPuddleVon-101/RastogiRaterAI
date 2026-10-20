'use client'
import { useEffect, useRef } from 'react'

// Ask Ticky chat/intro background. The Stonky dark grid identity (same lines as
// the quant grid used app-wide) layered with a subtle, premium "matrix" of
// faint emerald glyphs on a canvas. The glyphs sit very dim at rest and brighten
// + scale around the cursor, with sparse random flips so the field feels alive
// but never noisy. An emerald top glow and a readability vignette keep the
// title and chat fully legible. Pointer-events off; reacts via a window
// listener so the chat underneath stays clickable. Honors reduced motion.
//
// Adapted from the 21st.dev "Cyber Matrix" idea, rebuilt for performance
// (single canvas, capped DPR, ~30fps, cached cell grid) and themed to Stonky.

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$%<>/+=*#'

export function TickyMatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(pointer: coarse)').matches

    const cell = 30
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    let cols = 0
    let rows = 0
    let glyphs: string[] = []   // current char per cell
    let mx = -9999
    let my = -9999
    const radius = 260

    const build = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(w / cell)
      rows = Math.ceil(h / cell)
      glyphs = new Array(cols * rows)
      for (let i = 0; i < glyphs.length; i++) glyphs[i] = CHARS[(Math.random() * CHARS.length) | 0]
      ctx.font = '600 15px var(--font-mono, monospace)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      mx = e.clientX
      my = e.clientY
    }

    let raf = 0
    let last = 0
    const r2 = radius * radius

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw)
      if (t - last < 33) return // ~30fps
      last = t

      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)

      // sparse random glyph flips, so the field shimmers gently
      const flips = Math.max(1, (glyphs.length / 600) | 0)
      for (let f = 0; f < flips; f++) {
        glyphs[(Math.random() * glyphs.length) | 0] = CHARS[(Math.random() * CHARS.length) | 0]
      }

      for (let c = 0; c < cols; c++) {
        const cx = c * cell + cell / 2
        const dx = cx - mx
        for (let r = 0; r < rows; r++) {
          const cy = r * cell + cell / 2
          const dy = cy - my
          const dist2 = dx * dx + dy * dy
          // base rest brightness is very low; cursor proximity lifts it
          let intensity = 0
          if (dist2 < r2) intensity = 1 - Math.sqrt(dist2) / radius
          const alpha = 0.05 + intensity * 0.62
          // emerald: lighter + glowing near the cursor
          const light = 42 + intensity * 34
          ctx.fillStyle = `hsla(150, ${55 + intensity * 30}%, ${light}%, ${alpha})`
          ctx.shadowColor = 'rgba(46,148,102,0.9)'
          ctx.shadowBlur = intensity * 12
          ctx.fillText(glyphs[c * rows + r], cx, cy)
        }
      }
      ctx.shadowBlur = 0
    }

    build()
    window.addEventListener('resize', build)
    if (!coarse) window.addEventListener('pointermove', onMove, { passive: true })

    if (reduced) {
      // one static pass, no animation loop
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      for (let c = 0; c < cols; c++)
        for (let r = 0; r < rows; r++) {
          ctx.fillStyle = 'hsla(150, 55%, 42%, 0.06)'
          ctx.fillText(glyphs[c * rows + r], c * cell + cell / 2, r * cell + cell / 2)
        }
    } else {
      raf = requestAnimationFrame(draw)
    }

    return () => {
      window.removeEventListener('resize', build)
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ background: '#050608' }}>
      {/* matrix glyph field */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Stonky quant grid lines, masked so it never reads like a dev dashboard */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(115,128,130,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(115,128,130,0.10)_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_92%_70%_at_50%_30%,#000_55%,transparent_100%)] [-webkit-mask-image:radial-gradient(ellipse_92%_70%_at_50%_30%,#000_55%,transparent_100%)]" />

      {/* emerald glow, upper centre */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_640px_at_50%_24%,rgba(46,148,102,0.20),transparent_72%)]" />

      {/* readability vignette so the title + chat stay crisp over the matrix */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_90%_at_50%_46%,rgba(5,6,8,0.55)_30%,rgba(5,6,8,0.18)_58%,rgba(5,6,8,0.7)_100%)]" />
    </div>
  )
}
