'use client'
import { useEffect, useRef } from 'react'

// Cinematic particle wordmark, adapted from the 21st.dev steering-particle
// effect. Heavily reworked for Stonky:
//  - deterministic phase timeline instead of frame-count word cycling
//  - tagline forms first, then dissolves into the brand, which locks forever
//  - restrained editorial palette (ivory / muted gold / desaturated teal)
//  - responsive canvas, no demo chrome, no pointer destruction mechanics

interface Vec { x: number; y: number }
type RGB = [number, number, number]

interface ParticleTextEffectProps {
  title: string
  tagline: string
  className?: string
  /** Start the timeline this many seconds in (repeat visits jump near the lock). */
  startAt?: number
  /** Fired once the first word has been sampled and particles exist. */
  onReady?: () => void
}

// Palette (muted, premium; never rainbow)
const IVORY: RGB = [244, 240, 232]
const GOLD: RGB = [201, 162, 76]
const TEAL: RGB = [96, 138, 132]
const GREEN: RGB = [62, 122, 85]
const RED: RGB = [150, 80, 74]
const FAINT: RGB = [86, 84, 80]

// Phase boundaries in seconds (PRD timing).
const T = {
  scatterEnd: 1.0,
  tagFormEnd: 3.8,
  tagHoldEnd: 4.9,
  dissolveEnd: 6.4,
  brandFormEnd: 8.8,
}

function pick<Type>(arr: { v: Type; w: number }[]): Type {
  let r = Math.random()
  for (const { v, w } of arr) {
    if ((r -= w) <= 0) return v
  }
  return arr[arr.length - 1].v
}

const TAG_COLORS = (): RGB => pick([{ v: IVORY, w: 0.7 }, { v: GOLD, w: 0.3 }])
const BRAND_COLORS = (): RGB =>
  pick([
    { v: IVORY, w: 0.78 },
    { v: TEAL, w: 0.14 },
    { v: GOLD, w: 0.06 },
    { v: GREEN, w: 0.01 },
    { v: RED, w: 0.01 },
  ])

class Particle {
  pos: Vec = { x: 0, y: 0 }
  vel: Vec = { x: 0, y: 0 }
  target: Vec = { x: 0, y: 0 }
  maxSpeed = 4
  maxForce = 0.22
  startColor: RGB = FAINT
  targetColor: RGB = FAINT
  colorWeight = 1
  colorBlendRate = 0.02
  size = 2
  wobble = Math.random() * Math.PI * 2

  retarget(t: Vec, color: RGB, blendRate: number) {
    this.target = t
    // current blended color becomes the new start so transitions never pop
    this.startColor = this.color()
    this.targetColor = color
    this.colorWeight = 0
    this.colorBlendRate = blendRate
  }

  color(): RGB {
    const w = this.colorWeight
    return [
      Math.round(this.startColor[0] + (this.targetColor[0] - this.startColor[0]) * w),
      Math.round(this.startColor[1] + (this.targetColor[1] - this.startColor[1]) * w),
      Math.round(this.startColor[2] + (this.targetColor[2] - this.startColor[2]) * w),
    ]
  }

  move(settle: boolean, now: number) {
    if (this.colorWeight < 1) this.colorWeight = Math.min(1, this.colorWeight + this.colorBlendRate)

    // Locked words breathe very slightly so the canvas never looks frozen.
    const tx = this.target.x + (settle ? Math.sin(now * 0.0012 + this.wobble) * 0.6 : 0)
    const ty = this.target.y + (settle ? Math.cos(now * 0.0010 + this.wobble) * 0.6 : 0)

    const dx = tx - this.pos.x
    const dy = ty - this.pos.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1e-6

    // slow down near the target (proximity damping from the source asset)
    const proximity = dist < 90 ? dist / 90 : 1
    const desiredX = (dx / dist) * this.maxSpeed * proximity
    const desiredY = (dy / dist) * this.maxSpeed * proximity

    let steerX = desiredX - this.vel.x
    let steerY = desiredY - this.vel.y
    const sm = Math.sqrt(steerX * steerX + steerY * steerY)
    if (sm > this.maxForce) {
      steerX = (steerX / sm) * this.maxForce
      steerY = (steerY / sm) * this.maxForce
    }

    this.vel.x += steerX
    this.vel.y += steerY
    this.pos.x += this.vel.x
    this.pos.y += this.vel.y
  }

  draw(ctx: CanvasRenderingContext2D, alpha: number, trail: boolean) {
    const [r, g, b] = this.color()
    if (trail) {
      // comet streak while travelling: a short line opposite the velocity
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.28})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(this.pos.x - this.vel.x * 2.4, this.pos.y - this.vel.y * 2.4)
      ctx.lineTo(this.pos.x, this.pos.y)
      ctx.stroke()
    }
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
    ctx.fillRect(this.pos.x - this.size / 2, this.pos.y - this.size / 2, this.size, this.size)
  }
}

export function ParticleTextEffect({ title, tagline, className, startAt = 0, onReady }: ParticleTextEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | undefined>(undefined)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0
    let H = 0
    let dpr = 1
    let tagTargets: Vec[] = []
    let brandTargets: Vec[] = []
    let pool: Particle[] = []
    let phase = ''
    let start = 0
    let ready = false

    // The particle targets are sampled from rasterised text, so this has to be
    // the family the page actually renders in. It used to be hardcoded to
    // Inter; once the app moved to Schibsted Grotesk that silently sampled a
    // fallback face and the letterforms stopped matching the brand.
    const uiFont =
      getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() ||
      'system-ui'

    const sampleText = (text: string, fontPx: number, stride: number, weight: number, yBias = 0.5): Vec[] => {
      const off = document.createElement('canvas')
      off.width = Math.max(1, Math.floor(W))
      off.height = Math.max(1, Math.floor(H))
      const octx = off.getContext('2d')
      if (!octx) return []
      octx.fillStyle = '#fff'
      // Shrink until the rendered text genuinely fits with margin: never clipped.
      let px = fontPx
      octx.font = `${weight} ${px}px ${uiFont}, system-ui, sans-serif`
      while (px > 18 && octx.measureText(text).width > W * 0.94) {
        px -= 2
        octx.font = `${weight} ${px}px ${uiFont}, system-ui, sans-serif`
      }
      octx.textAlign = 'center'
      octx.textBaseline = 'middle'
      // yBias > 0.5 seats the word lower in the stage (the hero brand sits low
      // and dominant, clear of the navbar's airspace).
      octx.fillText(text, off.width / 2, off.height * yBias)
      const data = octx.getImageData(0, 0, off.width, off.height).data
      const pts: Vec[] = []
      for (let y = 0; y < off.height; y += stride) {
        for (let x = 0; x < off.width; x += stride) {
          if (data[(y * off.width + x) * 4 + 3] > 128) pts.push({ x, y })
        }
      }
      for (let i = pts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[pts[i], pts[j]] = [pts[j], pts[i]]
      }
      return pts
    }

    const edgePoint = (): Vec => {
      // scatter targets pushed toward the stage edges so dissolves feel outward
      const angle = Math.random() * Math.PI * 2
      const mag = (W + H) / 3.2
      return { x: W / 2 + Math.cos(angle) * mag * (0.5 + Math.random()), y: H / 2 + Math.sin(angle) * mag * (0.5 + Math.random()) }
    }

    const build = () => {
      const rect = canvas.getBoundingClientRect()
      W = rect.width
      H = rect.height
      if (W < 10 || H < 10) return
      dpr = Math.min(window.devicePixelRatio || 1, 1.75)
      canvas.width = Math.floor(W * dpr)
      canvas.height = Math.floor(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Brand is larger and denser than the tagline: the dominant object of the
      // hero. Seated low in the stage (yBias 0.62) so it owns the fold.
      const brandFont = Math.max(56, Math.min(258, (W / Math.max(title.length, 1)) * 2.5))
      const tagFont = Math.max(22, Math.min(82, (W / Math.max(tagline.length, 1)) * 1.5))
      brandTargets = sampleText(title, brandFont, 4, 800, 0.62)
      tagTargets = sampleText(tagline, tagFont, 5, 700)

      const N = Math.max(brandTargets.length, tagTargets.length, 1)
      if (pool.length !== N) {
        pool = []
        for (let i = 0; i < N; i++) {
          const p = new Particle()
          p.pos = { x: Math.random() * W, y: Math.random() * H }
          p.target = { x: Math.random() * W, y: Math.random() * H }
          p.maxSpeed = Math.random() * 4 + 6.5
          p.maxForce = p.maxSpeed * 0.09
          p.size = Math.random() * 1.2 + 1.6
          pool.push(p)
        }
      }
      phase = '' // force phase re-entry so targets rebind after resize
      if (!ready && brandTargets.length > 0 && tagTargets.length > 0) {
        ready = true
        onReadyRef.current?.()
      }
    }

    // The loop parks itself once the brand has locked AND the field has
    // actually stopped moving. Driving this off measured velocity rather than
    // a fixed delay means a slow first paint can never freeze the wordmark
    // half-formed.
    const STILL_SPEED = 0.06   // px/frame, averaged across the pool
    const STILL_FRAMES = 45    // consecutive still frames before parking
    let stillCount = 0

    const enterPhase = (name: string) => {
      if (phase === name) return
      phase = name
      if (name === 'scattered') {
        pool.forEach(p => p.retarget({ x: Math.random() * W, y: Math.random() * H }, FAINT, 0.03))
      } else if (name === 'formingTagline') {
        pool.forEach((p, i) => {
          if (i < tagTargets.length) p.retarget(tagTargets[i], TAG_COLORS(), 0.018)
          else p.retarget(edgePoint(), FAINT, 0.01)
        })
      } else if (name === 'morphing') {
        pool.forEach(p => p.retarget(edgePoint(), pick([{ v: GOLD, w: 0.45 }, { v: TEAL, w: 0.3 }, { v: FAINT, w: 0.25 }]), 0.025))
      } else if (name === 'formingBrand') {
        pool.forEach((p, i) => {
          if (i < brandTargets.length) p.retarget(brandTargets[i], BRAND_COLORS(), 0.02)
          else p.retarget(edgePoint(), FAINT, 0.01)
        })
      }
    }

    build()
    start = performance.now() - startAt * 1000

    const onResize = () => { build(); kick() }
    window.addEventListener('resize', onResize)

    const draw = (now: number) => {
      const t = (now - start) / 1000
      ctx.clearRect(0, 0, W, H)

      let alpha = 1
      let settle = false
      let trail = true

      if (t < T.scatterEnd) {
        enterPhase('scattered')
        alpha = Math.min(1, t / 0.6) * 0.5
      } else if (t < T.tagFormEnd) {
        enterPhase('formingTagline')
        alpha = 0.55 + 0.45 * Math.min(1, (t - T.scatterEnd) / 1.6)
      } else if (t < T.tagHoldEnd) {
        enterPhase('formingTagline')
        alpha = 1
        settle = true
        trail = false
      } else if (t < T.dissolveEnd) {
        enterPhase('morphing')
        alpha = 0.9 - 0.4 * ((t - T.tagHoldEnd) / (T.dissolveEnd - T.tagHoldEnd))
      } else if (t < T.brandFormEnd) {
        enterPhase('formingBrand')
        alpha = 0.6 + 0.4 * Math.min(1, (t - T.dissolveEnd) / 1.4)
      } else {
        // Brand locked. It never cycles away.
        enterPhase('formingBrand')
        alpha = 1
        settle = true
        trail = false
      }

      const tagCount = phase === 'formingTagline' ? tagTargets.length : brandTargets.length
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i]
        p.move(settle, now)
        const isExtra = i >= tagCount && (phase === 'formingTagline' || phase === 'formingBrand')
        p.draw(ctx, isExtra ? alpha * 0.16 : alpha, trail && !isExtra)
      }

      // The wordmark locks and then never changes again, but the loop used to
      // keep repainting that identical frame 60-120x a second for the rest of
      // the session. Park once it has locked and come to rest; the canvas keeps
      // the last painted frame on screen.
      if (t > T.brandFormEnd) {
        let speed = 0
        for (let i = 0; i < pool.length; i++) {
          const v = pool[i].vel
          speed += Math.abs(v.x) + Math.abs(v.y)
        }
        stillCount = speed / pool.length < STILL_SPEED ? stillCount + 1 : 0
        if (stillCount >= STILL_FRAMES) {
          rafRef.current = undefined
          return
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }
    const kick = () => {
      if (rafRef.current === undefined) rafRef.current = requestAnimationFrame(draw)
    }
    kick()

    return () => {
      window.removeEventListener('resize', onResize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = undefined
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, tagline, startAt])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
