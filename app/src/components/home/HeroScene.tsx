import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Grid, Trail } from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
  ChromaticAberration,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

const CYAN = new THREE.Color('#00f0ff')
const GREEN = new THREE.Color('#00ff88')
const RED = new THREE.Color('#ff2d55')

/* ------------------------------------------------------------------ */
/*  Shared mutable state (avoids React re-renders inside the loop)     */
/* ------------------------------------------------------------------ */
type Ripple = { active: boolean; t: number; pos: THREE.Vector3; color: THREE.Color }
const RIPPLE_POOL = 6

function useSceneState() {
  return useMemo(() => {
    const ripples: Ripple[] = Array.from({ length: RIPPLE_POOL }, () => ({
      active: false,
      t: 0,
      pos: new THREE.Vector3(),
      color: GREEN.clone(),
    }))
    return {
      flash: { v: 0 }, // core breach flash 0..1
      ripples,
      spawnRipple(pos: THREE.Vector3) {
        const r = ripples.find((x) => !x.active)
        if (!r) return
        r.active = true
        r.t = 0
        r.pos.copy(pos)
      },
    }
  }, [])
}

/* ------------------------------------------------------------------ */
/*  Aegis core — Fresnel shield shader + counter-rotating wireframe    */
/* ------------------------------------------------------------------ */
const coreVert = /* glsl */ `
  varying vec3 vN; varying vec3 vV;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`
const coreFrag = /* glsl */ `
  uniform vec3 uA; uniform vec3 uB; uniform vec3 uBreach;
  uniform float uFlash; uniform float uTime;
  varying vec3 vN; varying vec3 vV;
  void main() {
    float fres = pow(1.0 - max(dot(vN, vV), 0.0), 3.0);
    vec3 col = mix(uA, uB, fres);
    float pulse = 0.5 + 0.5 * sin(uTime * 1.6);
    col += uBreach * uFlash * 1.8;
    // rim-dominant: transparent centre, bright glowing edge
    float a = fres * 0.95 + 0.03 + uFlash * 0.35;
    gl_FragColor = vec4(col * (0.3 + fres * 1.9 + pulse * 0.1), a);
  }
`

function AegisCore({ state }: { state: ReturnType<typeof useSceneState> }) {
  const shell = useRef<THREE.Mesh>(null)
  const wire = useRef<THREE.Mesh>(null)
  const inner = useRef<THREE.Mesh>(null)
  const mat = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uA: { value: CYAN.clone().multiplyScalar(0.5) },
      uB: { value: CYAN.clone() },
      uBreach: { value: RED.clone() },
      uFlash: { value: 0 },
      uTime: { value: 0 },
    }),
    [],
  )

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime
    if (mat.current) {
      mat.current.uniforms.uTime.value = t
      mat.current.uniforms.uFlash.value = state.flash.v
    }
    state.flash.v = Math.max(0, state.flash.v - dt * 1.8)
    if (shell.current) shell.current.rotation.y += dt * 0.1
    if (wire.current) {
      wire.current.rotation.y -= dt * 0.16
      wire.current.rotation.x += dt * 0.05
    }
    if (inner.current) {
      inner.current.rotation.y += dt * 0.3
      inner.current.rotation.z -= dt * 0.12
      const p = 1 + Math.sin(t * 1.6) * 0.04
      inner.current.scale.setScalar(p)
    }
  })

  return (
    <group>
      {/* glowing fresnel shell */}
      <mesh ref={shell}>
        <icosahedronGeometry args={[2.0, 5]} />
        <shaderMaterial
          ref={mat}
          vertexShader={coreVert}
          fragmentShader={coreFrag}
          uniforms={uniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* structural wireframe */}
      <mesh ref={wire}>
        <icosahedronGeometry args={[2.25, 1]} />
        <meshBasicMaterial
          color={CYAN}
          wireframe
          transparent
          opacity={0.38}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* inner green heart */}
      <mesh ref={inner}>
        <icosahedronGeometry args={[1.15, 0]} />
        <meshBasicMaterial
          color={GREEN}
          wireframe
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  Attack streaks — glowing projectiles with trails toward the core   */
/* ------------------------------------------------------------------ */
function randomOnSphere(r: number, out: THREE.Vector3) {
  const u = Math.random(), v = Math.random()
  const theta = 2 * Math.PI * u
  const phi = Math.acos(2 * v - 1)
  out.set(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta) * 0.55, // flatten a bit
    r * Math.cos(phi),
  )
  return out
}

function Attacker({
  state,
  delay,
  color,
}: {
  state: ReturnType<typeof useSceneState>
  delay: number
  color: THREE.Color
}) {
  const ref = useRef<THREE.Mesh>(null)
  const from = useRef(new THREE.Vector3())
  const p = useRef(-delay) // progress, negative = waiting
  const speed = useRef(0.35 + Math.random() * 0.25)

  useMemo(() => randomOnSphere(6.5, from.current), [])

  useFrame((_, dt) => {
    if (!ref.current) return
    p.current += dt * speed.current
    if (p.current >= 1) {
      // impact: breach flash + defensive ripple, then respawn
      state.flash.v = 1
      state.spawnRipple(new THREE.Vector3(0, 0, 0))
      randomOnSphere(6.5, from.current)
      p.current = -Math.random() * 0.6
      speed.current = 0.35 + Math.random() * 0.3
    }
    const t = Math.max(0, p.current)
    // ease toward core
    const e = t * t
    ref.current.position.lerpVectors(from.current, new THREE.Vector3(0, 0, 0), e)
    const vis = t > 0.02
    ref.current.visible = vis
    const s = 0.06 + t * 0.05
    ref.current.scale.setScalar(vis ? s : 0.0001)
  })

  return (
    <Trail width={1.1} length={5} color={color} attenuation={(w) => w * w} decay={1.4}>
      <mesh ref={ref}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </Trail>
  )
}

/* ------------------------------------------------------------------ */
/*  Defense ripples — expanding rings emitted on impact                */
/* ------------------------------------------------------------------ */
function DefenseRipples({ state }: { state: ReturnType<typeof useSceneState> }) {
  const group = useRef<THREE.Group>(null)
  const refs = useRef<THREE.Mesh[]>([])

  useFrame((_, dt) => {
    state.ripples.forEach((r, i) => {
      const mesh = refs.current[i]
      if (!mesh) return
      if (r.active) {
        r.t += dt * 1.6
        if (r.t >= 1) {
          r.active = false
          mesh.visible = false
          return
        }
        mesh.visible = true
        const scale = 0.4 + r.t * 3.2
        mesh.scale.setScalar(scale)
        const m = mesh.material as THREE.MeshBasicMaterial
        m.opacity = (1 - r.t) * 0.8
      } else {
        mesh.visible = false
      }
    })
  })

  return (
    <group ref={group}>
      {state.ripples.map((_, i) => (
        <mesh key={i} ref={(el) => el && (refs.current[i] = el)} visible={false}>
          <torusGeometry args={[1, 0.02, 8, 64]} />
          <meshBasicMaterial
            color={GREEN}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  Sweeping scan ring                                                 */
/* ------------------------------------------------------------------ */
function ScanRing() {
  const ref = useRef<THREE.Mesh>(null)
  const R = 3.2
  useFrame((s) => {
    if (!ref.current) return
    const y = Math.sin(s.clock.elapsedTime * 0.7) * R * 0.9
    ref.current.position.y = y
    const k = Math.sqrt(Math.max(0.0001, R * R - y * y)) / R
    ref.current.scale.set(k, k, k)
    ref.current.rotation.z += 0.008
  })
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[R, 0.01, 8, 96]} />
      <meshBasicMaterial color={CYAN} transparent opacity={0.6} toneMapped={false} blending={THREE.AdditiveBlending} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/*  Depth particle field                                               */
/* ------------------------------------------------------------------ */
function DepthField({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)
  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 34
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18
      pos[i * 3 + 2] = (Math.random() - 0.5) * 22 - 4
      const roll = Math.random()
      const c = roll < 0.6 ? CYAN : roll < 0.85 ? GREEN : new THREE.Color('#ffffff')
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return g
  }, [count])
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.01 })
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.04} vertexColors transparent opacity={0.7} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

/* ------------------------------------------------------------------ */
/*  Rig — mouse parallax + scroll dolly                                */
/* ------------------------------------------------------------------ */
function Rig({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const { camera } = useThree()
  const target = useRef(new THREE.Vector3(0, 0.3, 0))
  useFrame((s, dt) => {
    const damp = 1 - Math.pow(0.0015, dt)
    const px = s.pointer.x, py = s.pointer.y
    const sc = scrollRef.current
    const camX = px * 1.6
    const camY = 0.8 + py * 1.0
    const camZ = 10 + sc * 5
    camera.position.x += (camX - camera.position.x) * damp
    camera.position.y += (camY - camera.position.y) * damp
    camera.position.z += (camZ - camera.position.z) * damp
    camera.lookAt(target.current)
  })
  return null
}

function CoreScene({ count, scrollRef }: { count: number; scrollRef: React.MutableRefObject<number> }) {
  const state = useSceneState()
  const attackers = useMemo(
    () => Array.from({ length: 9 }, (_, i) => ({ delay: (i / 9) * 3.2, color: i % 3 === 0 ? RED : i % 3 === 1 ? new THREE.Color('#ffb800') : CYAN })),
    [],
  )
  return (
    <>
      <fog attach="fog" args={['#050507', 9, 28]} />
      <Rig scrollRef={scrollRef} />
      <DepthField count={count} />
      <AegisCore state={state} />
      <ScanRing />
      <DefenseRipples state={state} />
      {attackers.map((a, i) => (
        <Attacker key={i} state={state} delay={a.delay} color={a.color} />
      ))}
      <Grid
        position={[0, -3.4, 0]}
        args={[60, 60]}
        cellSize={0.8}
        cellThickness={0.6}
        cellColor="#0a5a63"
        sectionSize={4}
        sectionThickness={1}
        sectionColor="#00c8d4"
        fadeDistance={30}
        fadeStrength={2}
        infiniteGrid
      />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Postprocessing — the cinematic layer                               */
/* ------------------------------------------------------------------ */
function Post() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.9}
        luminanceThreshold={0.22}
        luminanceSmoothing={0.85}
        mipmapBlur
        radius={0.6}
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[0.0006, 0.0009]}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={0.28} darkness={0.85} />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.28} />
    </EffectComposer>
  )
}

export default function HeroScene() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef(0)
  const [active, setActive] = useState(true)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => setActive(e.isIntersecting && !document.hidden),
      { threshold: 0.02 },
    )
    io.observe(el)
    const onVis = () => setActive(!document.hidden)
    const onScroll = () => {
      scrollRef.current = Math.min(1, window.scrollY / (window.innerHeight || 800))
    }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const count = useMemo(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 260 : 520), [])
  const frameloop = reduced ? 'demand' : active ? 'always' : 'never'

  return (
    <div ref={wrapRef} className="absolute inset-0 z-0" aria-hidden>
      <Canvas
        camera={{ position: [0, 0.8, 10], fov: 45 }}
        dpr={[1, 1.75]}
        frameloop={frameloop}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <CoreScene count={count} scrollRef={scrollRef} />
        {!reduced && <Post />}
      </Canvas>
    </div>
  )
}
