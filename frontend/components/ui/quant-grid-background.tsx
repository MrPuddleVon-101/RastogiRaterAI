'use client'

import { useRef, useEffect } from 'react'

interface NoiseProps {
  patternRefreshInterval?: number
  patternAlpha?: number
}

const Noise: React.FC<NoiseProps> = ({ patternRefreshInterval = 3, patternAlpha = 12 }) => {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let frame = 0
    let id = 0
    const size = 768

    const resize = () => {
      canvas.width = size
      canvas.height = size
      canvas.style.width = '100vw'
      canvas.style.height = '100vh'
    }

    const draw = () => {
      const img = ctx.createImageData(size, size)
      const data = img.data
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255
        data[i] = v
        data[i + 1] = v
        data[i + 2] = v
        data[i + 3] = patternAlpha
      }
      ctx.putImageData(img, 0, 0)
    }

    const loop = () => {
      if (frame % patternRefreshInterval === 0) draw()
      frame++
      id = requestAnimationFrame(loop)
    }

    window.addEventListener('resize', resize)
    resize()
    loop()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(id)
    }
  }, [patternRefreshInterval, patternAlpha])

  return (
    <canvas ref={ref} className="pointer-events-none absolute inset-0" style={{ imageRendering: 'pixelated' }} />
  )
}

export default function QuantGridBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 bg-[#030405]">
      {/* soft teal aura, top centre */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_720px_at_50%_16%,rgba(33,68,72,0.30),transparent_72%)]" />

      {/* quant grid, masked so it never reads like a developer dashboard */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(115,128,130,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(115,128,130,0.14)_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_88%_62%_at_50%_18%,#000_58%,transparent_100%)] [-webkit-mask-image:radial-gradient(ellipse_88%_62%_at_50%_18%,#000_58%,transparent_100%)]" />

      {/* fade the lower viewport toward black */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(3,4,5,0.20)_45%,rgba(3,4,5,0.94)_100%)]" />

      <Noise patternRefreshInterval={3} patternAlpha={12} />
    </div>
  )
}
