/**
 * The page's entire ambient backdrop, in one static layer.
 *
 * This replaces four separate always-on effects that used to run together:
 * a 2D canvas grid, a cursor spotlight driving an uncancelled rAF loop, a
 * full-screen SVG `filter: url()` gooey pass, and a pixel-trail mouse layer.
 * Together they repainted large areas every frame and produced the "laggy but
 * still flat" feel: lots of GPU work spent on effects that read as decoration
 * behind the content rather than depth within it.
 *
 * Everything here is painted once and then composited for free:
 *   - a fine measurement grid, tightening toward the horizon
 *   - a low emerald bloom that seats the page in its own light
 *   - film grain, which is what actually keeps large dark fields from
 *     banding and reading as flat vector gray
 *
 * No canvas, no rAF, no pointer listeners, no per-frame work at all.
 */

// Static grain. feTurbulence is rasterised once by the browser and then reused
// as an ordinary background image, so this costs nothing per frame. Kept at
// low opacity: it should be felt, not seen.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E\")"

export function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Measurement grid. Perspective comes from the rows tightening as they
          recede, not from a 3D transform, so it stays crisp at any zoom. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.055) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.055) 1px, transparent 1px)`,
          backgroundSize: '74px 74px',
          maskImage:
            'radial-gradient(130% 100% at 50% 0%, #000 0%, rgba(0,0,0,0.55) 46%, transparent 82%)',
          WebkitMaskImage:
            'radial-gradient(130% 100% at 50% 0%, #000 0%, rgba(0,0,0,0.55) 46%, transparent 82%)',
        }}
      />

      {/* Emerald bloom overhead: the page's single light source. Everything
          else on the page is lit consistently with this. */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(92% 58% at 50% -8%, rgba(46, 148, 102, 0.16) 0%, transparent 58%),
            radial-gradient(70% 46% at 50% 108%, rgba(46, 148, 102, 0.05) 0%, transparent 62%)`,
        }}
      />

      {/* Grain. The single most effective cue for stopping a large near-black
          field from looking like flat vector gray. */}
      <div
        className="absolute inset-0 opacity-[0.16] mix-blend-overlay"
        style={{ backgroundImage: GRAIN, backgroundRepeat: 'repeat' }}
      />
    </div>
  )
}
