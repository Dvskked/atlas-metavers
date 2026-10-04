import { useMemo } from 'react'
import * as THREE from 'three'
import { makeSky, makeStars } from '../game/textures'
import { ATLAS } from '../atlas/palette'

const AMBER = '#ffb648'

/** Domo nocturno con estrellas y skyline lejano. */
export function Sky() {
    const skyTex = useMemo(() => makeSky(), [])
    const starTex = useMemo(() => makeStars(), [])

    const skyline = useMemo(() => {
        const boxes = []
        for (let i = 0; i < 46; i++) {
            const a = (i / 46) * Math.PI * 2 + Math.random() * 0.06
            const r = 46 + Math.random() * 26
            const h = 6 + Math.random() * 22
            boxes.push({
                x: Math.cos(a) * r,
                z: Math.sin(a) * r,
                w: 5 + Math.random() * 9,
                h,
                d: 5 + Math.random() * 9,
                // rotación para que la ventana mire al parque
                rot: Math.atan2(Math.cos(a), Math.sin(a)),
                lit: Math.random() < 0.62,
            })
        }
        return boxes
    }, [])

    return (
        <group>
            <mesh scale={[-1, 1, 1]} renderOrder={-10}>
                <sphereGeometry args={[160, 24, 16]} />
                <meshBasicMaterial map={skyTex} side={THREE.BackSide} fog={false} depthWrite={false} />
            </mesh>

            <mesh scale={[-1, 1, 1]} renderOrder={-9}>
                <sphereGeometry args={[152, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
                <meshBasicMaterial
                    map={starTex}
                    side={THREE.BackSide}
                    fog={false}
                    depthWrite={false}
                    transparent
                    opacity={0.95}
                />
            </mesh>

            {skyline.map((b, i) => (
                <mesh key={i} position={[b.x, b.h / 2 - 0.4, b.z]}>
                    <boxGeometry args={[b.w, b.h, b.d]} />
                    <meshBasicMaterial color={i % 3 === 0 ? '#071426' : '#050f1e'} fog={false} />
                </mesh>
            ))}

            {skyline
                .filter((b) => b.lit)
                .map((b, i) => (
                    <mesh
                        key={`w${i}`}
                        position={[b.x * 0.965, b.h * (0.28 + (i % 4) * 0.16), b.z * 0.965]}
                        rotation={[0, b.rot, 0]}
                    >
                        <planeGeometry args={[b.w * 0.45, 0.6]} />
                        <meshBasicMaterial
                            color={i % 3 === 0 ? AMBER : ATLAS.cyan}
                            fog={false}
                            transparent
                            opacity={0.5}
                        />
                    </mesh>
                ))}
        </group>
    )
}