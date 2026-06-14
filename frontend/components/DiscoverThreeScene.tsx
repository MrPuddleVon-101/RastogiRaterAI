'use client'
import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AuraTheme } from '@/lib/auraTheme'

// The Discover chamber's real React Three Fiber scene: a luxury stock card
// revealed on a moon-rock product stage in deep space. The load-bearing element
// is the TERRAIN, not the stars. A displaced low-poly lunar floor fills the
// lower frame, a jagged rock ridge rises behind the card, big rim-lit boulders
// frame the foreground, theme-tinted ground mist hugs the surface, and a strong
// horizon glow + aura + stage light wash both the rock and the card with the
// active company's brand color. A faint planet sits in the far field. The HTML
// stock card sits on top with sharp text; this Canvas builds the world behind.
//
// Loaded only on Discover, SSR disabled, all GPU resources disposed on unmount.

interface SceneProps {
  theme: AuraTheme
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

// --- value noise (deterministic) for terrain displacement -------------------

function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
function vnoise(x: number, y: number): number {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const tl = hash2(xi, yi), tr = hash2(xi + 1, yi)
  const bl = hash2(xi, yi + 1), br = hash2(xi + 1, yi + 1)
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  return ((tl * (1 - u) + tr * u) * (1 - v) + (bl * (1 - u) + br * u) * v) - 0.5
}

// --- moon-floor terrain ------------------------------------------------------
// A wide plane displaced by layered value noise into a rocky lunar surface.
// Amplitude grows toward the far edge so the horizon reads as a jagged ridge;
// a shallow circular stage under the card keeps the platform legible.

function MoonFloor() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(80, 46, 150, 110)
    const pos = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      // far field (high local y) gets taller ridges -> jagged horizon
      const far = THREE.MathUtils.clamp((y + 8) / 24, 0, 1)
      let h = 0
      h += vnoise(x * 0.14, y * 0.14) * (2.0 + far * 2.4) // broad dunes -> tall ridges
      h += vnoise(x * 0.42, y * 0.42) * (0.8 + far * 0.6) // mid bumps
      h += vnoise(x * 1.2, y * 1.2) * 0.3                 // fine grit
      h += Math.sin(x * 0.32) * Math.cos(y * 0.26) * 0.35 // crossing ridges
      // flatten a small circular stage directly under the card
      const stage = Math.max(0, 1 - Math.sqrt(x * x + (y * 0.7) * (y * 0.7)) / 5)
      h *= 1 - stage * 0.7
      pos.setZ(i, h)
    }
    g.computeVertexNormals()
    return g
  }, [])
  useEffect(() => () => geo.dispose(), [geo])

  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2 + 0.34, 0, 0]} position={[0, -3.1, -3]}>
      {/* lighter graphite so lights actually register on the rock */}
      <meshStandardMaterial color="#3A3F4D" roughness={0.95} metalness={0.12} flatShading />
    </mesh>
  )
}

// --- rock clusters (foreground + ridge) -------------------------------------

interface RockSeed { pos: [number, number, number]; scale: [number, number, number]; rot: [number, number, number]; tint: string }

function roughRockGeo(seedScale: number) {
  const g = new THREE.IcosahedronGeometry(1, 1)
  const pos = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const f = 0.66 + hash2(pos.getX(i) * seedScale, pos.getZ(i) * (seedScale + 0.4)) * 0.6
    pos.setXYZ(i, pos.getX(i) * f, pos.getY(i) * (0.55 + f * 0.35), pos.getZ(i) * f)
  }
  g.computeVertexNormals()
  return g
}

function Rocks({ seeds }: { seeds: RockSeed[] }) {
  const geo = useMemo(() => roughRockGeo(3.1), [])
  useEffect(() => () => geo.dispose(), [geo])
  return (
    <group>
      {seeds.map((s, i) => (
        <mesh key={i} geometry={geo} position={s.pos} scale={s.scale} rotation={s.rot}>
          <meshStandardMaterial color={s.tint} roughness={0.97} metalness={0.1} flatShading />
        </mesh>
      ))}
    </group>
  )
}

// --- sparse distant asteroids ------------------------------------------------

interface DriftSeed { pos: [number, number, number]; scale: number; rotSpeed: number; bob: number; phase: number }

function Asteroids({ seeds }: { seeds: DriftSeed[] }) {
  const group = useRef<THREE.Group>(null)
  const geo = useMemo(() => roughRockGeo(2.3), [])
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
          <meshStandardMaterial color="#2A2E3A" roughness={0.92} metalness={0.15} flatShading />
        </mesh>
      ))}
    </group>
  )
}

// --- planetary backdrop ------------------------------------------------------

function Planet() {
  return (
    <mesh position={[-13, 7.5, -30]}>
      <sphereGeometry args={[4.2, 48, 48]} />
      <meshStandardMaterial color="#1B2230" roughness={1} metalness={0} emissive="#0E1622" emissiveIntensity={0.4} />
    </mesh>
  )
}

// --- a couple of distant candlestick forms (abstract finance hint) ----------

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
          <mesh>
            <boxGeometry args={[0.16, b.h, 0.16]} />
            <meshStandardMaterial color={b.up ? '#2E9466' : '#B23A3A'} emissive={b.up ? '#2E9466' : '#B23A3A'} emissiveIntensity={0.45} roughness={0.4} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.03, b.h + 0.28, 0.03]} />
            <meshStandardMaterial color={b.up ? '#2E9466' : '#B23A3A'} emissive={b.up ? '#2E9466' : '#B23A3A'} emissiveIntensity={0.35} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// --- starfield (sparse, far, dim) -------------------------------------------

function Starfield({ count, dot }: { count: number; dot: THREE.Texture }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 18 + Math.random() * 24
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = Math.abs(r * Math.sin(phi) * Math.sin(theta)) * 0.55 + 3 // above horizon
      arr[i * 3 + 2] = -12 - Math.abs(r * Math.cos(phi))
    }
    return arr
  }, [count])

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.006
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.03) * 0.02
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial map={dot} size={0.09} color="#CFC9BD" transparent opacity={0.55} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// --- glow discs (1-2 soft metallic discs) -----------------------------------

interface DiscSeed { pos: [number, number, number]; scale: number; bob: number; phase: number; drift: number }

function GlowDiscs({ seeds, glow, target }: { seeds: DiscSeed[]; glow: THREE.Texture; target: THREE.Color }) {
  const refs = useRef<(THREE.Sprite | null)[]>([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    seeds.forEach((s, i) => {
      const sp = refs.current[i]
      if (!sp) return
      sp.position.x = s.pos[0] + Math.sin(t * s.drift + s.phase) * 0.6
      sp.position.y = s.pos[1] + Math.sin(t * (s.bob + 0.1) + s.phase) * 0.4
      ;(sp.material as THREE.SpriteMaterial).color.lerp(target, 0.03)
    })
  })
  return (
    <>
      {seeds.map((s, i) => (
        <sprite key={i} ref={el => { refs.current[i] = el }} position={s.pos} scale={s.scale}>
          <spriteMaterial map={glow} transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} color="#C9A24C" />
        </sprite>
      ))}
    </>
  )
}

// --- horizon glow + central aura + ground mist ------------------------------

function Atmosphere({
  glow, target, mistTarget,
  auraLight, stageLight,
}: {
  glow: THREE.Texture
  target: THREE.Color
  mistTarget: THREE.Color
  auraLight: React.MutableRefObject<THREE.PointLight | null>
  stageLight: React.MutableRefObject<THREE.PointLight | null>
}) {
  const horizon = useRef<THREE.Sprite>(null)
  const core = useRef<THREE.Sprite>(null)
  const halo = useRef<THREE.Sprite>(null)
  const groundA = useRef<THREE.Sprite>(null)
  const groundB = useRef<THREE.Sprite>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (const r of [horizon, core, halo]) {
      const s = r.current
      if (s) (s.material as THREE.SpriteMaterial).color.lerp(target, 0.05)
    }
    for (const r of [groundA, groundB]) {
      const s = r.current
      if (s) (s.material as THREE.SpriteMaterial).color.lerp(mistTarget, 0.04)
    }
    if (auraLight.current) auraLight.current.color.lerp(target, 0.05)
    if (stageLight.current) stageLight.current.color.lerp(target, 0.05)
    if (core.current) core.current.scale.setScalar(6.6 * (1 + Math.sin(t * 0.55) * 0.05))
    if (halo.current) { const b = 1 + Math.cos(t * 0.4) * 0.06; halo.current.scale.set(17 * b, 11 * b, 1) }
    if (groundA.current) groundA.current.position.x = -3 + Math.sin(t * 0.06) * 2.4
    if (groundB.current) groundB.current.position.x = 3 + Math.cos(t * 0.045) * 2.6
  })

  return (
    <group>
      {/* wide glowing horizon band behind the rock ridge */}
      <sprite ref={horizon} position={[0, 0.4, -16]} scale={[46, 12, 1]}>
        <spriteMaterial map={glow} transparent opacity={0.42} depthWrite={false} blending={THREE.AdditiveBlending} color="#C9A24C" />
      </sprite>
      {/* central reveal aura behind the card */}
      <sprite ref={core} position={[0, 0.3, -4]} scale={6.6}>
        <spriteMaterial map={glow} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} color="#C9A24C" />
      </sprite>
      <sprite ref={halo} position={[0, -0.4, -6.5]} scale={[17, 11, 1]}>
        <spriteMaterial map={glow} transparent opacity={0.24} depthWrite={false} blending={THREE.AdditiveBlending} color="#C9A24C" />
      </sprite>
      {/* mist hugging the ground line */}
      <sprite ref={groundA} position={[-3, -2.3, -1]} scale={[16, 5, 1]}>
        <spriteMaterial map={glow} transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} color="#C9A24C" />
      </sprite>
      <sprite ref={groundB} position={[3, -2.5, -2]} scale={[17, 5.5, 1]}>
        <spriteMaterial map={glow} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} color="#C9A24C" />
      </sprite>
    </group>
  )
}

// --- camera ------------------------------------------------------------------

function CameraRig({ pointer }: { pointer: React.MutableRefObject<{ x: number; y: number }> }) {
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const cam = state.camera
    cam.position.x += (Math.sin(t * 0.05) * 0.4 + pointer.current.x * 0.55 - cam.position.x) * 0.025
    cam.position.y += (0.7 + Math.cos(t * 0.045) * 0.18 + pointer.current.y * 0.3 - cam.position.y) * 0.025
    cam.lookAt(0, -1.1, -4)
  })
  return null
}

function SceneContent({ theme, quality }: SceneProps) {
  const pointer = useRef({ x: 0, y: 0 })
  const auraLight = useRef<THREE.PointLight | null>(null)
  const stageLight = useRef<THREE.PointLight | null>(null)
  const [target, setTarget] = useState(() => new THREE.Color(theme.glow))
  const [particleTarget, setParticleTarget] = useState(() => new THREE.Color(theme.particle))
  // atmospheric fog: a dark blue-grey base nudged toward the brand, never black
  const fog = useMemo(() => new THREE.Color('#0C1018'), [])

  const glow = useMemo(() => radialTexture([[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.3)'], [1, 'rgba(255,255,255,0)']]), [])
  const dot = useMemo(() => radialTexture([[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,0.55)'], [1, 'rgba(255,255,255,0)']]), [])
  useEffect(() => () => { glow.dispose(); dot.dispose() }, [glow, dot])

  useEffect(() => {
    setTarget(new THREE.Color(theme.glow))
    setParticleTarget(new THREE.Color(theme.particle))
  }, [theme.glow, theme.particle])

  // fog morphs toward a dark mix of the theme fog tint (keeps a hint of brand)
  useFrame(() => { fog.lerp(new THREE.Color(theme.fog).lerp(new THREE.Color('#0C1018'), 0.55), 0.04) })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  const full = quality === 'full'

  // big rim-lit boulders: foreground silhouettes + a ridge behind the card
  const rocks = useMemo<RockSeed[]>(() => {
    const list: RockSeed[] = [
      // foreground silhouettes breaking the lower frame
      { pos: [-5.4, -3.0, 1.8], scale: [3.4, 2.3, 3.0], rot: [0.2, 0.5, 0.1], tint: '#1B1E29' },
      { pos: [5.7, -3.1, 1.4], scale: [3.7, 2.6, 3.3], rot: [0.1, -0.6, -0.15], tint: '#1B1E29' },
      { pos: [-3.0, -3.2, 2.6], scale: [1.8, 1.2, 1.7], rot: [0.3, 1.1, 0.0], tint: '#23272F' },
      { pos: [3.2, -3.3, 2.4], scale: [1.9, 1.2, 1.8], rot: [0.1, -1.3, 0.1], tint: '#23272F' },
      // midground ridge flanking + behind the card stage
      { pos: [-4.4, -2.4, -2.5], scale: [2.6, 2.0, 2.4], rot: [0.1, 0.3, 0.05], tint: '#363B49' },
      { pos: [4.6, -2.5, -3.0], scale: [2.8, 2.2, 2.6], rot: [0.0, -0.4, -0.1], tint: '#363B49' },
      { pos: [-1.8, -2.6, -4.5], scale: [2.0, 1.7, 1.9], rot: [0.2, 0.8, 0.0], tint: '#3A3F4D' },
      { pos: [2.0, -2.7, -4.8], scale: [2.2, 1.8, 2.1], rot: [0.1, -0.9, 0.05], tint: '#3A3F4D' },
    ]
    if (full) {
      list.push({ pos: [-7.6, -2.6, -1.0], scale: [3.6, 2.8, 3.3], rot: [0.1, 0.3, 0.05], tint: '#2A2E3A' })
      list.push({ pos: [7.8, -2.7, -1.6], scale: [3.8, 3.0, 3.5], rot: [0.0, -0.4, -0.1], tint: '#2A2E3A' })
    }
    return list
  }, [full])

  const drifters = useMemo<DriftSeed[]>(() => {
    const list: DriftSeed[] = []
    const n = full ? 4 : 2
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      list.push({
        pos: [Math.cos(a) * (6 + Math.random() * 2), 2 + Math.random() * 3, -8 - Math.random() * 5],
        scale: 0.5 + Math.random() * 0.9,
        rotSpeed: (Math.random() - 0.5) * 0.12,
        bob: 0.1 + Math.random() * 0.18,
        phase: Math.random() * Math.PI * 2,
      })
    }
    return list
  }, [full])

  const candles = useMemo<CandleSeed[]>(() => {
    const spots: [number, number, number][] = full
      ? [[-6.0, 2.0, -7], [6.2, 1.4, -7.5], [-5.0, 0.6, -8.5]]
      : [[-5.4, 1.6, -7]]
    return spots.map((p, i) => ({
      pos: p, scale: 0.6 + Math.random() * 0.28, up: i % 2 === 0,
      rotSpeed: (Math.random() - 0.5) * 0.3, bob: 0.16 + Math.random() * 0.18, phase: Math.random() * Math.PI * 2,
    }))
  }, [full])

  const discs = useMemo<DiscSeed[]>(() => {
    const spots: [number, number, number][] = full ? [[-3.8, 1.8, -5.5], [4.0, 0.0, -6]] : [[3.6, 1.0, -5.5]]
    return spots.map((p) => ({
      pos: p, scale: 1.2 + Math.random() * 0.8, bob: 0.1 + Math.random() * 0.15,
      phase: Math.random() * Math.PI * 2, drift: 0.04 + Math.random() * 0.08,
    }))
  }, [full])

  return (
    <>
      <fog attach="fog" args={[fog, 13, 46]} />
      {/* readable base fill so the rock is never pure black */}
      <ambientLight intensity={0.5} />
      <hemisphereLight color="#43506B" groundColor="#15110C" intensity={0.7} />
      {/* cool key from upper-back-left: strong rim on ridge tops */}
      <directionalLight position={[-5, 9, -3]} intensity={1.25} color="#aebbd0" />
      {/* soft fill from front-right */}
      <directionalLight position={[5, 4, 6]} intensity={0.45} color="#cdd6e0" />
      {/* brand aura light washing the card + near rock from the front */}
      <pointLight ref={auraLight} position={[0, 0.6, 1.6]} intensity={13} distance={28} decay={2} color={theme.glow} />
      {/* warm stage light low at the horizon spilling onto the rock ridge */}
      <pointLight ref={stageLight} position={[0, -2.2, -5]} intensity={8} distance={20} decay={2} color={theme.light} />
      <CameraRig pointer={pointer} />
      <Starfield count={full ? 360 : 200} dot={dot} />
      <Planet />
      <MoonFloor />
      <Rocks seeds={rocks} />
      <Asteroids seeds={drifters} />
      {candles.map((s, i) => <CandleCluster key={i} seed={s} />)}
      <GlowDiscs seeds={discs} glow={glow} target={particleTarget} />
      <Atmosphere glow={glow} target={target} mistTarget={particleTarget} auraLight={auraLight} stageLight={stageLight} />
    </>
  )
}

export default function DiscoverThreeScene({ theme, quality }: SceneProps) {
  return (
    <Canvas
      dpr={[1, quality === 'full' ? 1.75 : 1.25]}
      camera={{ fov: 58, position: [0, 0.7, 7], near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <color attach="background" args={['#080A10']} />
      <SceneContent theme={theme} quality={quality} />
    </Canvas>
  )
}
