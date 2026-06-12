'use client'
import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// The Discover chamber's Three.js stage: a deep starfield, volumetric mist
// sprites, rising ember particles, and a central aura that morphs toward the
// active stock's color. Camera drifts slowly; everything eases toward the
// pointer for parallax. Loaded only on the Discover page, SSR disabled,
// cleaned up automatically on unmount by react-three-fiber.

interface SceneProps {
  /** Active stock accent; the aura and embers lerp toward it. */
  accent: string
  /** Lower particle counts and dpr on small screens. */
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

/** Slowly rotating field of distant ivory stars. */
function Starfield({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // shell distribution so stars surround the camera with depth
      const r = 9 + Math.random() * 16
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6
      arr[i * 3 + 2] = -Math.abs(r * Math.cos(phi)) - 2
    }
    return arr
  }, [count])

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.008
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.03) * 0.015
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#ECE7DF"
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

/** Rising embers tinted by the active stock's accent. */
function Embers({ count, target }: { count: number; target: THREE.Color }) {
  const ref = useRef<THREE.Points>(null)
  const matRef = useRef<THREE.PointsMaterial>(null)
  const seeds = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const speed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10
      pos[i * 3 + 1] = -3 + Math.random() * 7
      pos[i * 3 + 2] = -1 - Math.random() * 4
      speed[i] = 0.08 + Math.random() * 0.22
    }
    return { pos, speed }
  }, [count])

  useFrame((_, delta) => {
    const points = ref.current
    if (!points) return
    const attr = points.geometry.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < count; i++) {
      let y = attr.getY(i) + seeds.speed[i] * delta
      if (y > 4.2) y = -3.2
      attr.setY(i, y)
    }
    attr.needsUpdate = true
    if (matRef.current) matRef.current.color.lerp(target, 0.035)
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[seeds.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.05}
        color="#5FA8A0"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/** Central aura + volumetric mist sprites, color-morphing per active stock. */
function Aura({ target, pointer }: { target: THREE.Color; pointer: React.MutableRefObject<{ x: number; y: number }> }) {
  const texture = useMemo(() => makeGlowTexture(), [])
  const core = useRef<THREE.Sprite>(null)
  const halo = useRef<THREE.Sprite>(null)
  const mistA = useRef<THREE.Sprite>(null)
  const mistB = useRef<THREE.Sprite>(null)
  const group = useRef<THREE.Group>(null)

  useEffect(() => () => texture.dispose(), [texture])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (const ref of [core, halo]) {
      const s = ref.current
      if (s) (s.material as THREE.SpriteMaterial).color.lerp(target, 0.04)
    }
    if (core.current) {
      const breathe = 1 + Math.sin(t * 0.6) * 0.06
      core.current.scale.setScalar(4.6 * breathe)
    }
    if (halo.current) {
      const breathe = 1 + Math.cos(t * 0.4) * 0.08
      halo.current.scale.set(10.5 * breathe, 7 * breathe, 1)
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
      <sprite ref={core} position={[0, -0.4, -3]} scale={4.6}>
        <spriteMaterial map={texture} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} color="#5FA8A0" />
      </sprite>
      <sprite ref={halo} position={[0, -1.4, -4.5]} scale={[10.5, 7, 1]}>
        <spriteMaterial map={texture} transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} color="#5FA8A0" />
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

export default function DiscoverThreeScene({ accent, quality }: SceneProps) {
  const pointer = useRef({ x: 0, y: 0 })
  const [target, setTarget] = useState(() => new THREE.Color(accent))

  useEffect(() => { setTarget(new THREE.Color(accent)) }, [accent])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  const stars = quality === 'full' ? 1100 : 450
  const embers = quality === 'full' ? 130 : 60

  return (
    <Canvas
      dpr={[1, quality === 'full' ? 1.75 : 1.25]}
      camera={{ fov: 60, position: [0, 0, 5], near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <CameraDrift pointer={pointer} />
      <Starfield count={stars} />
      <Embers count={embers} target={target} />
      <Aura target={target} pointer={pointer} />
    </Canvas>
  )
}
