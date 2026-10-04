import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import {
    makeBinPanel,
    makeCatalogPoster,
    makeGround,
    makeGroundLogo,
    makePath,
    makeStandPoster,
} from '../game/textures'
import { ATLAS, ACCENT } from '../atlas/palette'
import { STANDS } from '../atlas/brands'
import { BINS, LAMPS, STAND_SPOTS, TREES } from '../atlas/world'
import { REGISTRY } from './Interaction'

/* ---------------------------------------------------------------- */
/* Piezas reutilizables                                              */
/* ---------------------------------------------------------------- */

function Conifer({ x, z, s }) {
    return (
        <group position={[x, 0, z]} scale={s}>
            <mesh position={[0, 0.9, 0]} castShadow>
                <cylinderGeometry args={[0.12, 0.18, 1.8, 7]} />
                <meshStandardMaterial color="#2b2119" roughness={0.95} />
            </mesh>
            <mesh position={[0, 1.9, 0]} castShadow>
                <coneGeometry args={[1.05, 2.1, 7]} />
                <meshStandardMaterial color="#0f3b34" roughness={0.9} flatShading />
            </mesh>
            <mesh position={[0, 2.85, 0]} castShadow>
                <coneGeometry args={[0.75, 1.7, 7]} />
                <meshStandardMaterial color="#125048" roughness={0.9} flatShading />
            </mesh>
            <mesh position={[0, 3.6, 0]} castShadow>
                <coneGeometry args={[0.45, 1.2, 7]} />
                <meshStandardMaterial color="#16615a" roughness={0.9} flatShading />
            </mesh>
        </group>
    )
}

function Lamp({ x, z }) {
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, 0.06, 0]} castShadow>
                <cylinderGeometry args={[0.3, 0.36, 0.12, 12]} />
                <meshStandardMaterial color="#16233c" roughness={0.7} metalness={0.4} />
            </mesh>
            <mesh position={[0, 1.75, 0]} castShadow>
                <cylinderGeometry args={[0.06, 0.09, 3.4, 10]} />
                <meshStandardMaterial color="#1c2c48" roughness={0.6} metalness={0.5} />
            </mesh>
            <mesh position={[0, 3.5, 0]}>
                <sphereGeometry args={[0.17, 14, 10]} />
                <meshStandardMaterial
                    color={ATLAS.cyanSoft}
                    emissive={ATLAS.cyan}
                    emissiveIntensity={2.4}
                    toneMapped={false}
                />
            </mesh>
            <mesh position={[0, 3.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.26, 0.03, 8, 20]} />
                <meshStandardMaterial
                    color={ATLAS.cyan}
                    emissive={ATLAS.cyan}
                    emissiveIntensity={0.9}
                    metalness={0.4}
                    roughness={0.3}
                />
            </mesh>
            <pointLight position={[0, 3.3, 0]} intensity={9} distance={9} decay={2} color={ATLAS.cyanSoft} />
        </group>
    )
}

function Bin({ x, z, hex, label, rot }) {
    const texture = useMemo(() => makeBinPanel(hex, label), [hex, label])
    return (
        <group position={[x, 0, z]} rotation={[0, rot, 0]}>
            <mesh position={[0, 0.55, 0]} castShadow>
                <boxGeometry args={[1.1, 1.1, 1.1]} />
                <meshStandardMaterial color="#0d1a2e" roughness={0.7} metalness={0.15} />
            </mesh>
            <mesh position={[0, 1.13, 0]} castShadow>
                <boxGeometry args={[1.18, 0.1, 1.18]} />
                <meshStandardMaterial color="#16263f" roughness={0.55} metalness={0.3} />
            </mesh>
            <mesh position={[0, 0.6, 0.565]}>
                <planeGeometry args={[0.95, 0.48]} />
                <meshBasicMaterial map={texture} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.36, 0.57]}>
                <planeGeometry args={[0.62, 0.13]} />
                <meshBasicMaterial color="#02060f" toneMapped={false} />
            </mesh>
        </group>
    )
}

function Stand({ spot }) {
    const stand = STANDS.find((s) => s.id === spot.id)
    const poster = useMemo(
        () => (spot.id === 'catalogo' ? makeCatalogPoster() : makeStandPoster(stand)),
        [spot.id, stand],
    )
    const planeRef = useRef(null)
    const accent = stand?.accent || ACCENT.mint

    useLayoutEffect(() => {
        const mesh = planeRef.current
        if (!mesh) return undefined
        REGISTRY.set(spot.id, { id: spot.id, kind: 'stand', mesh })
        return () => REGISTRY.delete(spot.id)
    }, [spot.id])

    return (
        <group position={[spot.x, 0, spot.z]} rotation={[0, spot.rot, 0]}>
            {/* peana */}
            <mesh position={[0, 0.45, 0]} castShadow>
                <boxGeometry args={[3.0, 0.9, 0.8]} />
                <meshStandardMaterial color="#152a45" roughness={0.65} metalness={0.12} />
            </mesh>
            <mesh position={[0, 0.95, 0]} castShadow>
                <boxGeometry args={[3.3, 0.1, 1.0]} />
                <meshStandardMaterial color="#1d3a5c" roughness={0.5} metalness={0.25} />
            </mesh>
            {/* marco */}
            <mesh position={[0, 2.35, 0]} castShadow>
                <boxGeometry args={[3.1, 2.35, 0.16]} />
                <meshStandardMaterial color="#0d1c31" roughness={0.7} />
            </mesh>
            <mesh position={[0, 2.35, 0.085]}>
                <boxGeometry args={[3.35, 2.6, 0.06]} />
                <meshStandardMaterial color="#060e1b" roughness={0.45} metalness={0.4} />
            </mesh>
            {/* póster separado del marco para evitar z-fighting */}
            <mesh ref={planeRef} position={[0, 2.35, 0.15]}>
                <planeGeometry args={[2.95, 2.2]} />
                <meshBasicMaterial map={poster} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
            {/* luz de acento */}
            <pointLight
                position={[0, 3.5, 0.8]}
                intensity={5}
                distance={5}
                decay={2}
                color={accent}
            />
            <mesh position={[0, 3.62, 0.42]}>
                <boxGeometry args={[1.5, 0.06, 0.1]} />
                <meshStandardMaterial
                    color={ATLAS.white}
                    emissive={accent}
                    emissiveIntensity={1.6}
                    toneMapped={false}
                />
            </mesh>
        </group>
    )
}

function Fence() {
    const posts = []
    for (let i = -16; i <= 16; i += 2) {
        posts.push({ x: i, z: -16.2 })
        posts.push({ x: i, z: 16.2 })
        posts.push({ x: -16.2, z: i })
        posts.push({ x: 16.2, z: i })
    }
    return (
        <group>
            {posts.map((p, i) => (
                <mesh key={i} position={[p.x, 0.6, p.z]} castShadow>
                    <boxGeometry args={[0.1, 1.2, 0.1]} />
                    <meshStandardMaterial color="#16273f" roughness={0.6} metalness={0.4} />
                </mesh>
            ))}
            {[16.2, -16.2].map((z) => (
                <mesh key={`h${z}`} position={[0, 1.05, z]}>
                    <boxGeometry args={[33, 0.06, 0.05]} />
                    <meshStandardMaterial
                        color={ATLAS.cyan}
                        emissive={ATLAS.cyan}
                        emissiveIntensity={0.55}
                        toneMapped={false}
                    />
                </mesh>
            ))}
            {[-16.2, 16.2].map((x) => (
                <mesh key={`v${x}`} position={[x, 1.05, 0]}>
                    <boxGeometry args={[0.05, 0.06, 33]} />
                    <meshStandardMaterial
                        color={ATLAS.cyan}
                        emissive={ATLAS.cyan}
                        emissiveIntensity={0.55}
                        toneMapped={false}
                    />
                </mesh>
            ))}
        </group>
    )
}

/** Luciérnagas: motas cyan a la deriva. */
function Motes() {
    const count = 70
    const data = useMemo(
        () =>
            Array.from({ length: count }, () => ({
                x: (Math.random() - 0.5) * 30,
                z: (Math.random() - 0.5) * 30,
                y: 0.5 + Math.random() * 3.4,
                p: Math.random() * Math.PI * 2,
                s: 0.5 + Math.random() * 0.9,
            })),
        [],
    )

    const geometry = useMemo(() => {
        const g = new THREE.BufferGeometry()
        const positions = new Float32Array(count * 3)
        data.forEach((d, i) => positions.set([d.x, d.y, d.z], i * 3))
        g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        return g
    }, [data])

    useEffect(() => () => geometry.dispose(), [geometry])

    useFrame(({ clock }) => {
        const t = clock.elapsedTime
        const pos = geometry.attributes.position
        for (let i = 0; i < count; i++) {
            const d = data[i]
            pos.setXYZ(
                i,
                d.x + Math.sin(t * 0.35 * d.s + d.p) * 0.7,
                d.y + Math.sin(t * 0.8 * d.s + d.p * 2) * 0.32,
                d.z + Math.cos(t * 0.3 * d.s + d.p) * 0.7,
            )
        }
        pos.needsUpdate = true
    })

    return (
        <points geometry={geometry} frustumCulled={false}>
            <pointsMaterial
                size={0.11}
                color={ATLAS.cyanSoft}
                transparent
                opacity={0.85}
                sizeAttenuation
                depthWrite={false}
                toneMapped={false}
            />
        </points>
    )
}

/* ---------------------------------------------------------------- */
/* Parque completo                                                  */
/* ---------------------------------------------------------------- */

export function Park() {
    const ground = useMemo(() => {
        const t = makeGround()
        t.repeat.set(9, 9)
        return t
    }, [])
    const pathTex = useMemo(() => makePath(), [])
    const logoTex = useMemo(() => makeGroundLogo(), [])

    return (
        <group>
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[120, 120]} />
                <meshStandardMaterial map={ground} roughness={0.92} metalness={0.04} />
            </mesh>

            {/* callejón central hacia la estación */}
            <mesh position={[0, 0.012, 2.5]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[6.2, 27]} />
                <meshBasicMaterial
                    map={pathTex}
                    transparent
                    depthWrite={false}
                    toneMapped={false}
                    opacity={0.85}
                />
            </mesh>

            {/* logo pintado en el suelo, frente al spawn */}
            <mesh position={[0, 0.02, 12.4]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[9, 4.5]} />
                <meshBasicMaterial map={logoTex} transparent depthWrite={false} toneMapped={false} />
            </mesh>

            <Fence />

            {TREES.map((t, i) => (
                <Conifer key={`t${i}`} x={t.x} z={t.z} s={t.s} />
            ))}

            {LAMPS.map((l, i) => (
                <Lamp key={`l${i}`} x={l.x} z={l.z} />
            ))}

            {BINS.map((b, i) => (
                <Bin key={`b${i}`} {...b} />
            ))}

            {STAND_SPOTS.map((s) => (
                <Stand key={s.id} spot={s} />
            ))}

            <Motes />
        </group>
    )
}