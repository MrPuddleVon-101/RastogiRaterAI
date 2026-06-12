'use client'
import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// The Discover chamber's real React Three Fiber scene: a cinematic stock
// reveal. A depth starfield, scene fog, lit low-poly asteroids, floating 3D
// candlestick clusters and glow discs, and a strong central aura + colored
// point light that morph toward the active stock's accent. The HTML stock card
// sits on top (sharp text/buttons); this Canvas builds the world behind it.
//
// Loaded only on Discover, SSR disabled, all GPU resources disposed on unmount.

interface SceneProps {
  accent: string
  quality: 'full' | 'lite'
}

// --- textures ---------------------------------------------------------------

function radialTexture(stops: [number, string][]): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  for (const [o, col] of stops) g.addColorStop(o, col)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}

// --- starfield --------------------------------------------------------------

function Starfield({ count, dot }: { count: number; dot: THREE.Texture }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 12 + Math.random() * 26
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7
      arr[i * 3 + 2] = -8 - Math.abs(r * Math.cos(phi))
    }
    return arr
  }, [count])

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.012
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.04) * 0.04
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={dot}
        size={0.13}
        color="#EFEAE0"
        transparent
        opacity={0.92}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// --- asteroids --------------------------------------------------------------

interface RockSeed { pos: [number, number, number]; scale: number; rotSpeed: number; bob: number; phase: number }

function Asteroids({ seeds }: { seeds: RockSeed[] }) {
  const group = useRef<THREE.Group>(null)
  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 1)
    // roughen vertices so each rock is irregular, not a clean ball
    const pos = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const f = 0.78 + Math.random() * 0.32
      pos.setXYZ(i, pos.getX(i) * f, pos.getY(i) * f, pos.getZ(i) * f)
    }
    g.computeVertexNormals()
    return g
  }, [])
  useEffect(() => () => geo.dispose(), [geo])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    g.children.forEach((child, i) => {
      const s = seeds[i]
      child.rotation.x += delta * s.rotSpeed
      child.rotation.y += delta * s.rotSpeed * 0.7
      child.position.y = s.pos[1] + Math.sin(state.clock.elapsedTime * 0.3 + s.phase) * s.bob
    })
  })

  return (
    <group ref={group}>
      {seeds.map((s, i) => (
        <mesh key={i} geometry={geo} position={s.pos} scale={s.scale}>
          <meshStandardMaterial color="#15171d" roughness={0.92} metalness={0.15} flatShading />
        </mesh>
      ))}
    </group>
  )
}

// --- floating 3D candlestick clusters ---------------------------------------

interface CandleSeed { pos: [number, number, number]; scale: number; up: boolean; rotSpeed: number; bob: number; phase: number }

function CandleCluster({ seed }: { seed: CandleSeed }) {
  const ref = useRef<THREE.Group>(null)
  const bars = useMemo(() => {
    const out: { x: number; h: number; y: number; up: boolean }[] = []
    let level = 0
    for (let i = 0; i < 4; i++) {
      const up = Math.random() > (seed.up ? 0.35 : 0.65)
      const h = 0.25 + Math.random() * 0.5
      level += up ? h * 0.5 : -h * 0.4
      out.push({ x: (i - 1.5) * 0.34, h, y: level, up })
    }
    return out
  }, [seed.up])

  useFrame((state, delta) => {
    const g = ref.current
    if (!g) return
    g.rotation.y += delta * seed.rotSpeed
    g.position.y = seed.pos[1] + Math.sin(state.clock.elapsedTime * 0.4 + seed.phase) * seed.bob
  })

  return (
    <group ref={ref} position={seed.pos} scale={seed.scale}>
      {bars.map((b, i) => (
        <group key={i} position={[b.x, b.y, 0]}>
          {/* body */}
          <mesh>
            <boxGeometry args={[0.16, b.h, 0.16]} />
            <meshStandardMaterial
              color={b.up ? '#2E9466' : '#B23A3A'}
              emissive={b.up ? '#2E9466' : '#B23A3A'}
              emissiveIntensity={0.5}
              roughness={0.4}
            />
          </mesh>
          {/* wick */}
          <mesh>
            <boxGeometry args={[0.03, b.h + 0.28, 0.03]} />
            <meshStandardMaterial
              color={b.up ? '#2E9466' : '#B23A3A'}
              emissive={b.up ? '#2E9466' : '#B23A3A'}
              emissiveIntensity={0.4}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// --- glow discs + central aura ----------------------------------------------

interface DiscSeed { pos: [number, number, number]; scale: number; bob: number; phase: number; drift: number }

function GlowDiscs({ seeds, glow, target }: { seeds: DiscSeed[]; glow: THREE.Texture; target: THREE.Color }) {
  const refs = useRef<(THREE.Sprite | null)[]>([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    seeds.forEach((s, i) => {
      const sp = refs.current[i]
      if (!sp) return
      sp.position.x = s.pos[0] + Math.sin(t * s.drift + s.phase) * 0.7
      sp.position.y = s.pos[1] + Math.sin(t * (s.bob + 0.1) + s.phase) * 0.5
      ;(sp.material as THREE.SpriteMaterial).color.lerp(target, 0.03)
    })
  })
  return (
    <>
      {seeds.map((s, i) => (
        <sprite key={i} ref={el => { refs.current[i] = el }} position={s.pos} scale={s.scale}>
          <spriteMaterial map={glow} transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} color="#5FA8A0" />
        </sprite>
      ))}
    </>
  )
}

function Aura({ glow, target, light }: { glow: THREE.Texture; target: THREE.Color; light: React.MutableRefObject<THREE.PointLight | null> }) {
  const core = useRef<THREE.Sprite>(null)
  const halo = useRef<THREE.Sprite>(null)
  const mistA = useRef<THREE.Sprite>(null)
  const mistB = useRef<THREE.Sprite>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (const r of [core, halo]) {
      const s = r.current
      if (s) (s.material as THREE.SpriteMaterial).color.lerp(target, 0.05)
    }
    if (light.current) light.current.color.lerp(target, 0.05)
    if (core.current) core.current.scale.setScalar(6 * (1 + Math.sin(t * 0.6) * 0.06))
    if (halo.current) { const b = 1 + Math.cos(t * 0.4) * 0.08; halo.current.scale.set(14 * b, 9 * b, 1) }
    if (mistA.current) mistA.current.position.x = -3 + Math.sin(t * 0.07) * 1.6
    if (mistB.current) mistB.current.position.x = 3 + Math.cos(t * 0.05) * 1.8
  })

  return (
    <group>
      <sprite ref={core} position={[0, -0.2, -3]} scale={6}>
        <spriteMaterial map={glow} transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} color="#5FA8A0" />
      </sprite>
      <sprite ref={halo} position={[0, -1.2, -5]} scale={[14, 9, 1]}>
        <spriteMaterial map={glow} transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} color="#5FA8A0" />
      </sprite>
      <sprite ref={mistA} position={[-3, 1.6, -6]} scale={[9, 5, 1]}>
        <spriteMaterial map={glow} transparent opacity={0.07} depthWrite={false} blending={THREE.AdditiveBlending} color="#ECE7DF" />
      </sprite>
      <sprite ref={mistB} position={[3, -2.4, -6.5]} scale={[10, 6, 1]}>
        <spriteMaterial map={glow} transparent opacity={0.06} depthWrite={false} blending={THREE.AdditiveBlending} color="#8E9BAB" />
      </sprite>
    </group>
  )
}

// --- camera + scene ---------------------------------------------------------

function CameraRig({ pointer }: { pointer: React.MutableRefObject<{ x: number; y: number }> }) {
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const cam = state.camera
    cam.position.x += (Math.sin(t * 0.05) * 0.5 + pointer.current.x * 0.6 - cam.position.x) * 0.025
    cam.position.y += (Math.cos(t * 0.045) * 0.32 + pointer.current.y * 0.4 - cam.position.y) * 0.025
    cam.lookAt(0, -0.2, -3)
  })
  return null
}

function SceneContent({ accent, quality }: SceneProps) {
  const pointer = useRef({ x: 0, y: 0 })
  const lightRef = useRef<THREE.PointLight | null>(null)
  const [target, setTarget] = useState(() => new THREE.Color(accent))

  const glow = useMemo(() => radialTexture([[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.3)'], [1, 'rgba(255,255,255,0)']]), [])
  const dot = useMemo(() => radialTexture([[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,0.55)'], [1, 'rgba(255,255,255,0)']]), [])
  useEffect(() => () => { glow.dispose(); dot.dispose() }, [glow, dot])

  useEffect(() => { setTarget(new THREE.Color(accent)) }, [accent])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  const full = quality === 'full'

  // rocky ring sitting low and to the sides, framing the card like terrain
  const rocks = useMemo<RockSeed[]>(() => {
    const list: RockSeed[] = []
    const n = full ? 9 : 5
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const wide = 5.5 + Math.random() * 2.5
      list.push({
        pos: [Math.cos(a) * wide, -2.6 - Math.random() * 1.6 + Math.abs(Math.sin(a)) * 0.6, -3 - Math.random() * 4],
        scale: 0.7 + Math.random() * 1.5,
        rotSpeed: (Math.random() - 0.5) * 0.12,
        bob: 0.1 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2,
      })
    }
    return list
  }, [full])

  const candles = useMemo<CandleSeed[]>(() => {
    const list: CandleSeed[] = []
    const spots: [number, number, number][] = full
      ? [[-4.2, 1.6, -3], [4.4, 1.1, -3.5], [-3.6, -0.6, -2.5], [3.8, -1.4, -2.8], [-5, 0.2, -4.5]]
      : [[-4, 1.4, -3], [4.2, -0.8, -3.2]]
    spots.forEach((p, i) => list.push({
      pos: p, scale: 0.7 + Math.random() * 0.4, up: i % 2 === 0,
      rotSpeed: (Math.random() - 0.5) * 0.4, bob: 0.18 + Math.random() * 0.22, phase: Math.random() * Math.PI * 2,
    }))
    return list
  }, [full])

  const discs = useMemo<DiscSeed[]>(() => {
    const list: DiscSeed[] = []
    const n = full ? 6 : 3
    for (let i = 0; i < n; i++) {
      list.push({
        pos: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 5, -2 - Math.random() * 4],
        scale: 0.5 + Math.random() * 1.1, bob: 0.1 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2, drift: 0.05 + Math.random() * 0.12,
      })
    }
    return list
  }, [full])

  return (
    <>
      <fog attach="fog" args={['#070A0F', 9, 26]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 6, 4]} intensity={0.5} color="#cdd6e0" />
      <pointLight ref={lightRef} position={[0, 0.5, 1.5]} intensity={9} distance={22} decay={2} color={accent} />
      <CameraRig pointer={pointer} />
      <Starfield count={full ? 1300 : 550} dot={dot} />
      <Asteroids seeds={rocks} />
      {candles.map((s, i) => <CandleCluster key={i} seed={s} />)}
      <GlowDiscs seeds={discs} glow={glow} target={target} />
      <Aura glow={glow} target={target} light={lightRef} />
    </>
  )
}

export default function DiscoverThreeScene({ accent, quality }: SceneProps) {
  return (
    <Canvas
      dpr={[1, quality === 'full' ? 1.75 : 1.25]}
      camera={{ fov: 62, position: [0, 0, 6], near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <color attach="background" args={['#06080C']} />
      <SceneContent accent={accent} quality={quality} />
    </Canvas>
  )
}
