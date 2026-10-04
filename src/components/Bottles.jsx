import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { BOTTLE, disposeBottle, makeBottle } from '../game/bottle'
import { makeLabelTexture } from '../game/textures'
import { SPOTS } from '../atlas/world'
import { useStore } from '../store'
import { REGISTRY } from './Interaction'

/**
 * Halo invisible: sirve de diana al raycast y se enciende al mirarlo,
 * así el jugador sabe qué puede recoger.
 */
function makeHalo(color = '#ffffff') {
    const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.085, 0.085, BOTTLE.height + 0.07, 16, 1, true),
        new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            toneMapped: false,
        }),
    )
    mesh.position.y = BOTTLE.height / 2
    return mesh
}

function CleanBottle({ spot }) {
    const held = useStore((s) => s.held)
    const taken = held?.id === spot.id

    const texture = useMemo(
        () => makeLabelTexture({ a: '#00e5ff', b: '#eef5ff', ink: '#04101f', atlasRing: true }),
        [],
    )

    const group = useMemo(
        () =>
            makeBottle({
                label: texture,
                body: '#cfeefb',
                cap: '#00e5ff',
                tapa: spot.tapa,
                etiqueta: spot.etiqueta,
            }),
        [texture, spot.tapa, spot.etiqueta],
    )

    const halo = useMemo(() => makeHalo(), [])
    const holder = useRef(null)

    const label = spot.tapa && spot.etiqueta ? 'Botella PET completa' : 'Botella PET'

    useLayoutEffect(() => {
        REGISTRY.set(spot.id, {
            id: spot.id,
            kind: 'bottle',
            halo: true,
            mesh: halo,
            label,
            bottle: {
                id: spot.id,
                label,
                tapa: spot.tapa,
                etiqueta: spot.etiqueta,
                copy: false,
                marca: null,
            },
        })
        return () => REGISTRY.delete(spot.id)
    }, [spot, halo, label])

    useEffect(
        () => () => {
            disposeBottle(group)
            texture.dispose()
            halo.geometry.dispose()
            halo.material.dispose()
        },
        [group, texture, halo],
    )

    useFrame(({ clock }) => {
        if (taken || !holder.current) return
        const t = clock.elapsedTime
        holder.current.position.y = 0.01 + Math.sin(t * 1.6 + spot.x) * 0.012
        holder.current.rotation.y = spot.rot + t * 0.22
    })

    if (taken) return null

    return (
        <group position={[spot.x, 0, spot.z]}>
            <group ref={holder} position={[0, 0.01, 0]} scale={1.9}>
                <primitive object={group} />
            </group>
            <primitive object={halo} scale={1.9} />
            {/* sombra de contacto */}
            <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.12, 20]} />
                <meshBasicMaterial color="#00e5ff" transparent opacity={0.16} depthWrite={false} />
            </mesh>
        </group>
    )
}

export function Bottles() {
    return (
        <group>
            {SPOTS.map((spot) => (
                <CleanBottle key={spot.id} spot={spot} />
            ))}
        </group>
    )
}

export { makeHalo }