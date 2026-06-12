'use client'
import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// The Discover chamber's Three.js stage, product-reveal style: a glowing
// central aura that morphs toward the active stock's color, volumetric mist,
// and a handful of large soft orbs floating with depth around the card, like
// objects suspended in the reveal shot. No random dot starfield. Loaded only
// on the Discover page, SSR disabled, cleaned up by react-three-fiber on
// unmount.

interface SceneProps {
  /** Active stock accent; the aura and orbs lerp toward it. */
  accent: string
  /** Lower orb count and dpr on small screens. */
  quality: 'full' | 'lite'
}

function makeGlowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.32)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(c)
}

interface OrbSeed {
  base: THREE.Vector3
  scale: number
  bobAmp: number
  bobSpeed: number
  phase: number
  driftSpeed: number
  opacity: number
  tinted: boolean // accent-tinted orbs shift color with the stock
}

/**
 * Large soft orbs drifting with depth around the reveal: the floating-object
 * energy of a product shot, not a particle field.
 */
function FloatingOrbs({ count, target, texture }: { count: number; target: THREE.Color; texture: THREE.Texture }) {
  const refs = useRef<(THREE.Sprite | null)[]>([])
  const seeds = useMemo<OrbSeed[]>(() => {
    const out: OrbSeed[] = []
    for (let i = 0; i < count; i++) {
      const depth = -1.5 - Math.random() * 5.5
      out.push({
        base: new THREE.Vector3(
          (Math.random() - 0.5) * 11,
          (Math.random() - 0.5) * 5.5,
          depth,
        ),
        scale: 0.3 + Math.random() * 0.85,
        bobAmp: 0.25 + Math.random() * 0.5,
        bobSpeed: 0.12 + Math.random() * 0.22,
        phase: Math.random() * Math.PI * 2,
        driftSpeed: (Math.random() - 0.5) * 0.05,
        opacity: 0.08 + Math.random() * 0.14,
        tinted: i % 3 !== 2, // two thirds follow the stock's aura color
      })
    }
    return out
  }, [count])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    seeds.forEach((s, i) => {
      const sprite = refs.current[i]
      if (!sprite) return
      sprite.position.x = s.base.x + Math.sin(t * s.driftSpeed * 4 + s.phase) * 0.6
      sprite.position.y = s.base.y + Math.sin(t * s.bobSpeed + s.phase) * s.bobAmp
      const mat = sprite.material as THREE.SpriteMaterial
      if (s.tinted) mat.color.lerp(target, 0.03)
    })
  })

  return (
    <>
      {seeds.map((s, i) => (
        <sprite
          key={i}
          ref={el => { refs.current[i] = el }}
          position={s.base}
          scale={s.scale}
        >
          <spriteMaterial
            map={texture}
            transparent
            opacity={s.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            color={s.tinted ? '#5FA8A0' : '#ECE7DF'}
          />
        </sprite>
      ))}
    </>
  )
}

/** Central aura + volumetric mist sprites, color-morphing per active stock. */
function Aura({ target, pointer, texture }: { target: THREE.Color; pointer: React.MutableRefObject<{ x: number; y: number }>; texture: THREE.Texture }) {
  const core = useRef<THREE.Sprite>(null)
  const halo = useRef<THREE.Sprite>(null)
  const mistA = useRef<THREE.Sprite>(null)
  const mistB = useRef<THREE.Sprite>(null)
  const group = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (const ref of [core, halo]) {
      const s = ref.current
      if (s) (s.material as THREE.SpriteMaterial).color.lerp(target, 0.04)
    }
    if (core.current) {
      const breathe = 1 + Math.sin(t * 0.6) * 0.06
      core.current.scale.setScalar(5.4 * breathe)
    }
    if (halo.current) {
      const breathe = 1 + Math.cos(t * 0.4) * 0.08
      halo.current.scale.set(12 * breathe, 8 * breathe, 1)
    }
    if (mistA.current) {
      mistA.current.position.x = Math.sin(t * 0.07) * 1.6 - 2.4
      ;(mistA.current.material as THREE.SpriteMaterial).opacity = 0.05 + Math.sin(t * 0.21) * 0.018
    }
    if (mistB.current) {
      mistB.current.position.x = Math.cos(t * 0.05) * 1.8 + 2.6
      ;(mistB.current.material as THREE.SpriteMaterial).opacity = 0.045 + Math.cos(t * 0.17) * 0.016
    }
    // aura leans gently toward the pointer
    if (group.current) {
      group.current.position.x += (pointer.current.x * 0.55 - group.current.position.x) * 0.03
      group.current.position.y += (pointer.current.y * 0.35 - group.current.position.y) * 0.03
    }
  })

  return (
    <group ref={group}>
      <sprite ref={core} position={[0, -0.3, -3]} scale={5.4}>
        <spriteMaterial map={texture} transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} color="#5FA8A0" />
      </sprite>
      <sprite ref={halo} position={[0, -1.4, -4.5]} scale={[12, 8, 1]}>
        <spriteMaterial map={texture} transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} color="#5FA8A0" />
      </sprite>
      <sprite ref={mistA} position={[-2.4, 1.4, -5]} scale={[7, 4, 1]}>
        <spriteMaterial map={texture} transparent opacity={0.05} depthWrite={false} blending={THREE.AdditiveBlending} color="#ECE7DF" />
      </sprite>
      <sprite ref={mistB} position={[2.6, -2, -5.5]} scale={[8, 4.5, 1]}>
        <spriteMaterial map={texture} transparent opacity={0.045} depthWrite={false} blending={THREE.AdditiveBlending} color="#8E9BAB" />
      </sprite>
    </group>
  )
}

function CameraDrift({ pointer }: { pointer: React.MutableRefObject<{ x: number; y: number }> }) {
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const cam = state.camera
    cam.position.x += (Math.sin(t * 0.05) * 0.35 + pointer.current.x * 0.25 - cam.position.x) * 0.02
    cam.position.y += (Math.cos(t * 0.04) * 0.22 + pointer.current.y * 0.18 - cam.position.y) * 0.02
    cam.lookAt(0, 0, -3)
  })
  return null
}

function SceneContent({ accent, quality }: SceneProps) {
  const pointer = useRef({ x: 0, y: 0 })
  const [target, setTarget] = useState(() => new THREE.Color(accent))
  const texture = useMemo(() => makeGlowTexture(), [])

  useEffect(() => { setTarget(new THREE.Color(accent)) }, [accent])
  useEffect(() => () => texture.dispose(), [texture])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <>
      <CameraDrift pointer={pointer} />
      <FloatingOrbs count={quality === 'full' ? 13 : 7} target={target} texture={texture} />
      <Aura target={target} pointer={pointer} texture={texture} />
    </>
  )
}

export default function DiscoverThreeScene({ accent, quality }: SceneProps) {
  return (
    <Canvas
      dpr={[1, quality === 'full' ? 1.75 : 1.25]}
      camera={{ fov: 60, position: [0, 0, 5], near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <SceneContent accent={accent} quality={quality} />
    </Canvas>
  )
}
