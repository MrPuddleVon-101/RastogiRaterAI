'use client'
import DotField from './DotField'

// Ask Ticky chat/intro background: the React Bits DotField (interactive emerald
// dot grid that bulges away from the cursor) over a dark base, with an emerald
// glow and a readability vignette so the title and chat stay legible. Mounted
// ONLY on the chat/welcome state; the stock deck uses the clean grid instead.
// pointer-events:none on the wrapper keeps the chat clickable — DotField reacts
// via a window mousemove listener.

export function TickyDotBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ background: '#070709' }}>
      <DotField
        dotRadius={5}
        dotSpacing={20}
        bulgeStrength={85}
        glowRadius={180}
        sparkle={false}
        waveAmplitude={0}
        gradientFrom="rgba(95, 210, 150, 0.7)"
        gradientTo="rgba(46, 148, 102, 0.48)"
      />
      {/* emerald glow, upper centre */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_640px_at_50%_26%,rgba(46,148,102,0.2),transparent_72%)]" />
      {/* light edge fade so the dots stay prominent while content stays readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_125%_95%_at_50%_44%,transparent_54%,rgba(7,7,9,0.6)_100%)]" />
    </div>
  )
}
