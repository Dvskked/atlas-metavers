import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { ATLAS } from '../atlas/palette'
import { disposeBottle, makeBottle } from '../game/bottle'
import { makeHalo } from './Bottles'
import { makeLabelTexture, makeStationScreen } from '../game/textures'
import { sfx } from '../game/sfx'
import { STATION } from '../atlas/world'
import { SCAN_TIME, useStore } from '../store'
import { REGISTRY } from './Interaction'

const PARTS = ['botella', 'etiqueta', 'tapa']

/* ---------------------------------------------------------------- */
/* Kiosco                                                            */
/* ---------------------------------------------------------------- */

function Kiosk() {
    const screen = useMemo(() => makeStationScreen(), [])
    useEffect(() => () => screen.dispose(), [screen])

    const { z, w, h } = STATION.kiosk

    return (
        <group position={[STATION.x, 0, z]}>
            {[-w / 2, w / 2].map((x) => (
                <group key={x} position={[x, 0, 0]}>
                    <mesh position={[0, h / 2, 0]} castShadow>
                        <boxGeometry args={[0.34, h, 0.42]} />
                        <meshStandardMaterial color="#0f2036" roughness={0.55} metalness={0.45} />
                    </mesh>
                    <mesh position={[0, 0.12, 0]} castShadow>
                        <boxGeometry args={[0.7, 0.24, 0.7]} />
                        <meshStandardMaterial color="#153053" roughness={0.5} metalness={0.4} />
                    </mesh>
                    <mesh position={[0, h * 0.55, 0.23]}>
                        <boxGeometry args={[0.05, h * 0.62, 0.03]} />
                        <meshStandardMaterial
                            color={ATLAS.cyan}
                            emissive={ATLAS.cyan}
                            emissiveIntensity={1.6}
                            toneMapped={false}
                        />
                    </mesh>
                </group>
            ))}

            <mesh position={[0, h + 0.2, 0]} castShadow>
                <boxGeometry args={[w + 0.5, 0.4, 0.5]} />
                <meshStandardMaterial color="#0f2036" roughness={0.55} metalness={0.45} />
            </mesh>
            <mesh position={[0, h + 0.2, 0.28]}>
                <boxGeometry args={[w + 0.1, 0.07, 0.04]} />
                <meshStandardMaterial
                    color={ATLAS.cyanSoft}
                    emissive={ATLAS.cyan}
                    emissiveIntensity={2}
                    toneMapped={false}
                />
            </mesh>

            <mesh position={[0, h * 0.56, 0.18]}>
                <boxGeometry args={[w * 0.9, w * 0.82 * 0.625 + 0.2, 0.1]} />
                <meshStandardMaterial color="#08182c" roughness={0.5} metalness={0.4} />
            </mesh>
            <mesh position={[0, h * 0.56, 0.24]}>
                <planeGeometry args={[w * 0.82, w * 0.82 * 0.625]} />
                <meshBasicMaterial map={screen} toneMapped={false} />
            </mesh>

            <mesh position={[0, 0.02, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[1.9, 32]} />
                <meshBasicMaterial color={ATLAS.cyan} transparent opacity={0.08} depthWrite={false} />
            </mesh>
        </group>
    )
}

/* ---------------------------------------------------------------- */
/* Pedestal                                                          */
/* ---------------------------------------------------------------- */

function Pedestal() {
    const halo = useMemo(() => makeHalo(), [])
    const ring = useRef(null)
    const onPedestal = useStore((s) => s.onPedestal)
    const scan = useStore((s) => s.scan)
    const { pedestal, deckRadius } = STATION

    useLayoutEffect(() => {
        REGISTRY.set('pedestal', {
            id: 'pedestal',
            kind: 'pedestal',
            halo: true,
            mesh: halo,
            label: 'Estación de escaneo',
        })
        return () => REGISTRY.delete('pedestal')
    }, [halo])

    useEffect(
        () => () => {
            halo.geometry.dispose()
            halo.material.dispose()
        },
        [halo],
    )

    useFrame(({ clock }, delta) => {
        if (!ring.current) return
        const busy = scan === 'scanning'
        ring.current.rotation.z += delta * (busy ? 2.4 : 0.3)
        ring.current.material.emissiveIntensity = THREE.MathUtils.damp(
            ring.current.material.emissiveIntensity,
            busy ? 3 : onPedestal ? 1.4 : 0.5 + Math.sin(clock.elapsedTime * 1.6) * 0.2,
            8,
            delta,
        )
    })

    return (
        <group>
            <mesh position={[pedestal.x, 0.014, pedestal.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[deckRadius, 48]} />
                <meshStandardMaterial color="#0f2440" roughness={0.8} metalness={0.1} />
            </mesh>
            <mesh position={[pedestal.x, 0.024, pedestal.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[deckRadius - 0.18, deckRadius - 0.04, 48]} />
                <meshBasicMaterial color={ATLAS.cyan} transparent opacity={0.5} toneMapped={false} />
            </mesh>

            <mesh position={[pedestal.x, 0.11, pedestal.z]} castShadow receiveShadow>
                <cylinderGeometry args={[1.05, 1.25, 0.22, 8]} />
                <meshStandardMaterial color="#13253e" roughness={0.6} metalness={0.35} />
            </mesh>
            <mesh position={[pedestal.x, 0.58, pedestal.z]} castShadow>
                <cylinderGeometry args={[0.34, 0.52, 0.78, 12]} />
                <meshStandardMaterial color="#16304f" roughness={0.5} metalness={0.4} />
            </mesh>
            <mesh position={[pedestal.x, 0.92, pedestal.z]} rotation={[Math.PI / 2, 0, 0]} ref={ring}>
                <torusGeometry args={[0.44, 0.035, 10, 40]} />
                <meshStandardMaterial
                    color={ATLAS.cyan}
                    emissive={ATLAS.cyan}
                    emissiveIntensity={0.8}
                    toneMapped={false}
                />
            </mesh>
            <mesh position={[pedestal.x, pedestal.top - 0.04, pedestal.z]} castShadow receiveShadow>
                <cylinderGeometry args={[0.5, 0.46, 0.09, 24]} />
                <meshStandardMaterial color="#1b3a5c" roughness={0.42} metalness={0.5} />
            </mesh>
            <mesh position={[pedestal.x, pedestal.top + 0.012, pedestal.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.44, 28]} />
                <meshStandardMaterial
                    color="#071626"
                    emissive={ATLAS.cyan}
                    emissiveIntensity={0.4}
                    roughness={0.25}
                    metalness={0.6}
                />
            </mesh>

            <primitive object={halo} position={[pedestal.x, pedestal.top + 0.16, pedestal.z]} scale={1.5} />

            {Array.from({ length: 6 }, (_, i) => {
                const a = (i / 6) * Math.PI * 2
                return (
                    <mesh
                        key={i}
                        position={[
                            pedestal.x + Math.cos(a) * 0.74,
                            0.24,
                            pedestal.z + Math.sin(a) * 0.74,
                        ]}
                        rotation={[0, -a, 0.12]}
                    >
                        <boxGeometry args={[0.06, 0.46, 0.02]} />
                        <meshStandardMaterial
                            color={ATLAS.cyanSoft}
                            emissive={ATLAS.cyan}
                            emissiveIntensity={0.9}
                            transparent
                            opacity={0.7}
                            toneMapped={false}
                        />
                    </mesh>
                )
            })}
        </group>
    )
}

/* ---------------------------------------------------------------- */
/* Escáner: botella, recuadros y barrido                            */
/* ---------------------------------------------------------------- */

/** Las 24 esquinas del recuadro, al estilo de una detección YOLO. */
function cornerGeometry(box) {
    const size = new THREE.Vector3()
    box.getSize(size)
    const p = box.min
    const arm = Math.min(0.05, Math.max(size.x, size.y, size.z) * 0.38)
    const pts = []
    for (const ix of [0, 1]) {
        for (const iy of [0, 1]) {
            for (const iz of [0, 1]) {
                const cx = p.x + size.x * ix
                const cy = p.y + size.y * iy
                const cz = p.z + size.z * iz
                pts.push(cx, cy, cz, cx + arm * (ix ? -1 : 1), cy, cz)
                pts.push(cx, cy, cz, cx, cy + arm * (iy ? -1 : 1), cz)
                pts.push(cx, cy, cz, cx, cy, cz + arm * (iz ? -1 : 1))
            }
        }
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return geo
}

/**
 * El recuadro se monta en un grupo sin transformación para poder usar
 * directamente las coordenadas de mundo que devuelve Box3.
 */
function Bracket({ box }) {
    const geo = useMemo(() => cornerGeometry(box), [box])
    const center = useMemo(() => new THREE.Vector3(), [])
    useEffect(() => {
        box.getCenter(center)
    }, [box, center])
    useEffect(() => () => geo.dispose(), [geo])
    return (
        <lineSegments geometry={geo} position={center} renderOrder={20}>
            <lineBasicMaterial
                color={ATLAS.cyan}
                transparent
                opacity={0.95}
                depthTest={false}
                toneMapped={false}
            />
        </lineSegments>
    )
}

function OnPedestal({ parts }) {
    const onPedestal = useStore((s) => s.onPedestal)
    const detections = useStore((s) => s.detections)
    const scan = useStore((s) => s.scan)
    const holder = useRef(null)
    const plane = useRef(null)
    const light = useRef(null)
    const [boxes, setBoxes] = useState(null)

    const labelTexture = useMemo(
        () => makeLabelTexture({ a: '#00e5ff', b: '#eef5ff', ink: '#04101f', atlasRing: true }),
        [],
    )

    const bottle = useMemo(() => {
        if (!onPedestal) return null
        return makeBottle({
            label: labelTexture,
            body: '#cfeefb',
            cap: '#00e5ff',
            tapa: onPedestal.tapa,
            etiqueta: onPedestal.etiqueta,
            glow: true,
        })
    }, [onPedestal, labelTexture])

    useEffect(() => () => labelTexture.dispose(), [labelTexture])
    useEffect(() => () => disposeBottle(bottle), [bottle])

    useEffect(() => {
        const parent = holder.current
        if (!parent || !bottle) return undefined
        parent.add(bottle)
        const found = {}
        bottle.traverse((o) => {
            if (o.userData.part) found[o.userData.part] = o
        })
        for (const p of PARTS) parts.current[p] = found[p] || null
        return () => {
            parent.remove(bottle)
            for (const p of PARTS) parts.current[p] = null
            setBoxes(null)
        }
    }, [bottle, parts])

    useFrame(({ clock }, delta) => {
        const st = useStore.getState()
        const busy = st.scan === 'scanning'

        if (plane.current) {
            plane.current.visible = busy
            if (busy) {
                const p = Math.min(1, (performance.now() - st.scanStartedAt) / 1000 / SCAN_TIME)
                plane.current.position.y = -0.18 + p * 0.92
                plane.current.material.opacity = 0.18 + Math.sin(p * Math.PI) * 0.24
            }
        }

        if (holder.current) {
            holder.current.rotation.y = THREE.MathUtils.damp(
                holder.current.rotation.y,
                busy ? clock.elapsedTime * 1.5 : 0,
                4,
                delta,
            )
        }

        if (light.current) {
            const want = busy ? 20 : st.onPedestal ? 7 : 1.5
            light.current.intensity = THREE.MathUtils.damp(light.current.intensity, want, 6, delta)
        }

        if (scan === 'idle') return
        const next = {}
        for (const d of detections) {
            const node = parts.current[d.id]
            if (node) next[d.id] = new THREE.Box3().setFromObject(node)
        }
        setBoxes((prev) => (sameBoxes(prev, next) ? prev : next))
    })

    if (!onPedestal || !bottle) return null

    return (
        <>
            <group position={[STATION.pedestal.x, STATION.pedestal.top + 0.03, STATION.pedestal.z]}>
                <group ref={holder} scale={2.2} />

                <pointLight
                    ref={light}
                    position={[0, 0.5, 0]}
                    color={ATLAS.cyanSoft}
                    intensity={7}
                    distance={3.4}
                    decay={2}
                />

                <mesh ref={plane} position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
                    <planeGeometry args={[1.5, 1.5]} />
                    <meshBasicMaterial
                        color={ATLAS.cyanSoft}
                        transparent
                        opacity={0.3}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                        toneMapped={false}
                    />
                </mesh>
            </group>

            <group>
                {scan !== 'idle' &&
                    detections.map((d) =>
                        boxes?.[d.id] ? <Bracket key={d.id} box={boxes[d.id]} /> : null,
                    )}
            </group>
        </>
    )
}

function sameBoxes(a, b) {
    if (!a) return false
    const ka = Object.keys(a)
    if (ka.length !== Object.keys(b).length) return false
    return ka.every((k) => a[k].equals(b[k]))
}

/** Etiquetas DOM ancladas a cada recuadro: "Botella PET · 98.4%". */
function DetectionLabels({ parts }) {
    const detections = useStore((s) => s.detections)
    const scan = useStore((s) => s.scan)
    const camera = useThree((s) => s.camera)
    const tags = useMemo(() => ({}), [])
    const anchor = useMemo(() => new THREE.Vector3(), [])

    useLayoutEffect(() => {
        const created = []
        for (const part of PARTS) {
            const el = document.createElement('div')
            el.className = 'det-tag is-hidden'
            el.innerHTML = '<span class="det-tag-name"></span><span class="det-tag-conf"></span>'
            document.body.appendChild(el)
            tags[part] = el
            created.push(part)
        }
        return () => {
            for (const part of created) {
                tags[part]?.remove()
                delete tags[part]
            }
        }
    }, [tags])

    useEffect(() => {
        for (const d of detections) {
            const el = tags[d.id]
            if (!el) continue
            el.querySelector('.det-tag-name').textContent = d.label
            el.querySelector('.det-tag-conf').textContent = d.confidence
                ? `${(d.confidence * 100).toFixed(1)}%`
                : '···'
        }
        const orphans = PARTS.filter((p) => !detections.some((d) => d.id === p))
        for (const p of orphans) tags[p]?.classList.add('is-hidden')
    }, [detections, tags])

    useEffect(() => {
        if (scan === 'idle' || !useStore.getState().onPedestal) {
            for (const p of PARTS) tags[p]?.classList.add('is-hidden')
        }
    }, [scan, tags])

    useFrame(() => {
        const st = useStore.getState()
        if (st.scan === 'idle' || st.phase === 'modal') {
            for (const p of PARTS) tags[p]?.classList.add('is-hidden')
            return
        }
        for (const d of detections) {
            const el = tags[d.id]
            const node = d && parts.current[d.id]
            if (!el || !node) continue
            const box = new THREE.Box3().setFromObject(node)
            box.getCenter(anchor)
            anchor.y = box.max.y + 0.03
            anchor.project(camera)
            el.style.left = `${(anchor.x * 0.5 + 0.5) * window.innerWidth}px`
            el.style.top = `${(-anchor.y * 0.5 + 0.5) * window.innerHeight}px`
            el.classList.toggle('is-hidden', anchor.z >= 1)
        }
    })

    return null
}

/** Dispara los pitidos del escáner y cierra el análisis awarding los AtlasPuntos. */
function ScanDirector() {
    const scan = useStore((s) => s.scan)

    useEffect(() => {
        if (scan !== 'scanning') return undefined
        sfx('scan')
        const timers = [900, 1600, 2300].map((ms, i) =>
            window.setTimeout(() => sfx('scan'), ms + i * 60),
        )
        return () => timers.forEach(clearTimeout)
    }, [scan])

    useFrame(() => {
        const st = useStore.getState()
        if (st.scan !== 'scanning') return
        if ((performance.now() - st.scanStartedAt) / 1000 < SCAN_TIME) return
        const receipt = st.finishScan()
        if (receipt) {
            sfx('scanDone')
            window.setTimeout(() => sfx('points'), 260)
        }
    })

    return null
}

export function ScanStation() {
    const parts = useRef({})
    return (
        <group>
            <Kiosk />
            <Pedestal />
            <OnPedestal parts={parts} />
            <DetectionLabels parts={parts} />
            <ScanDirector />
        </group>
    )
}