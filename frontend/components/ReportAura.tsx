'use client'
import dynamic from 'next/dynamic'

// Client-only: WebGL must never run during SSR.
const GLSLHills = dynamic(
  () => import('@/components/ui/glsl-hills').then(m => m.GLSLHills),
  { ssr: false },
)

/**
 * A prominent GLSL "hills" aura behind the report, like smoky market terrain.
 * The ivory report cards are opaque, so they already protect their own text;
 * the masks here only keep the central column gaps calm so body copy in the
 * margins stays readable. Pointer-events off.
 */
export function ReportAura() {
  return (
    <div
      aria-hidden
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', inset: 0, opacity: 0.55 }}>
        <GLSLHills width="100vw" height="100vh" speed={0.32} cameraZ={112} planeSize={256} />
      </div>
      {/* Light central dim so the waves stay legible behind text gaps, while the
          left/right margins keep the waves at full strength. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to right, transparent 0%, rgba(6,7,9,0.42) 24%, rgba(6,7,9,0.44) 76%, transparent 100%)',
        }}
      />
      {/* gentle top/bottom calm */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(6,7,9,0.45) 0%, transparent 16%, transparent 84%, rgba(6,7,9,0.55) 100%)',
        }}
      />
    </div>
  )
}
