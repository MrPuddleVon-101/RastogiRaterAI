'use client'
import { useEffect, useRef, useState } from 'react'

// A market-signal cursor trail, adapted from the 21st.dev SVG follower.
// Reworked for RastogiRaterAI:
//  - fixed full-viewport overlay, pointer-events: none, never blocks clicks
//  - listens on window (the overlay itself can never receive events)
//  - restrained ivory/teal/gold palette, no rainbow, no recording mechanics
//  - "calm" mode for the report page, disabled on touch devices and
//    under prefers-reduced-motion

interface Position { x: number; y: number }

interface TrailPoint {
  position: Position
  time: number
  drift: Position
  age: number
  direction: Position
}

interface MarketCursorFollowerProps {
  /** full: home/discover. calm: report (thinner, quieter, no sparks). */
  intensity?: 'full' | 'calm'
}

class Follower {
  private points: TrailPoint[] = []
  private line: SVGPathElement
  private color: string
  private stage: SVGSVGElement
  private removeDelay: number
  private sparkChance: number

  constructor(stage: SVGSVGElement, color: string, removeDelay: number, sparkChance: number) {
    this.stage = stage
    this.color = color
    this.removeDelay = removeDelay
    this.sparkChance = sparkChance
    this.line = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    this.line.style.fill = color
    this.line.style.stroke = color
    this.line.style.strokeWidth = '1'
    this.stage.appendChild(this.line)
  }

  private getDrift(): number {
    return (Math.random() - 0.5) * 2
  }

  add(position: Position) {
    const direction = { x: 0, y: 0 }
    if (this.points[0]) {
      direction.x = (position.x - this.points[0].position.x) * 0.25
      direction.y = (position.y - this.points[0].position.y) * 0.25
    }

    const point: TrailPoint = {
      position,
      time: Date.now(),
      drift: {
        x: this.getDrift() + direction.x / 2,
        y: this.getDrift() + direction.y / 2,
      },
      age: 0,
      direction,
    }

    // Occasional tiny spark, scaled to cursor speed. Never large shapes.
    if (Math.random() < this.sparkChance) this.makeSpark(point)

    this.points.unshift(point)
    // hard cap so fast scrubbing can never build an expensive path
    if (this.points.length > 60) this.points.length = 60
  }

  private createLine(points: TrailPoint[]): string {
    const path: string[] = [points.length ? 'M' : '']
    if (points.length > 0) {
      let forward = true
      let i = 0
      while (i >= 0) {
        const point = points[i]
        const offsetX = point.direction.x * ((i - points.length) / points.length) * 0.55
        const offsetY = point.direction.y * ((i - points.length) / points.length) * 0.55
        const x = point.position.x + (forward ? offsetY : -offsetY)
        const y = point.position.y + (forward ? offsetX : -offsetX)
        point.age += 0.18
        path.push(String(x + point.drift.x * point.age))
        path.push(String(y + point.drift.y * point.age))
        i += forward ? 1 : -1
        if (i === points.length) {
          i--
          forward = false
        }
      }
    }
    return path.join(' ')
  }

  trim() {
    if (this.points.length > 0) {
      const last = this.points[this.points.length - 1]
      if (last.time < Date.now() - this.removeDelay) this.points.pop()
    }
    this.line.setAttribute('d', this.createLine(this.points))
  }

  private makeSpark(point: TrailPoint) {
    const speed = Math.abs(point.direction.x) + Math.abs(point.direction.y)
    if (speed < 2) return
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('r', String(Math.min(speed * 0.5, 3)))
    circle.style.fill = this.color
    circle.setAttribute('cx', '0')
    circle.setAttribute('cy', '0')
    this.stage.appendChild(circle)

    const driftX = point.position.x + point.direction.x * (Math.random() * 14)
    const driftY = point.position.y + point.direction.y * (Math.random() * 14)
    circle.style.transform = `translate(${point.position.x}px, ${point.position.y}px)`
    circle.style.transition = 'all 0.6s ease-out'
    setTimeout(() => {
      circle.style.transform = `translate(${driftX}px, ${driftY}px) scale(0)`
      setTimeout(() => {
        if (this.stage.contains(circle)) this.stage.removeChild(circle)
      }, 600)
    }, 10)
  }

  destroy() {
    if (this.stage.contains(this.line)) this.stage.removeChild(this.line)
  }
}

export function MarketCursorFollower({ intensity = 'full' }: MarketCursorFollowerProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    // Touch-primary devices and reduced-motion users get no trail at all.
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setEnabled(!coarse && !reduced)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const svg = svgRef.current
    if (!svg) return

    const calm = intensity === 'calm'
    const palette = calm
      ? [{ color: 'rgba(236,230,218,0.30)', spark: 0 }]
      : [
          { color: 'rgba(236,230,218,0.42)', spark: 0.05 },
          { color: 'rgba(96,138,132,0.34)', spark: 0.04 },
          { color: 'rgba(201,162,76,0.22)', spark: 0.06 },
        ]
    const removeDelay = calm ? 240 : 380

    const followers = palette.map(p => new Follower(svg, p.color, removeDelay, p.spark))

    const resize = () => {
      svg.setAttribute('width', String(window.innerWidth))
      svg.setAttribute('height', String(window.innerHeight))
    }
    resize()
    window.addEventListener('resize', resize)

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const position = { x: e.clientX, y: e.clientY }
      followers.forEach(f => f.add(position))
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    let raf = 0
    const animate = () => {
      followers.forEach(f => f.trim())
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
      followers.forEach(f => f.destroy())
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
