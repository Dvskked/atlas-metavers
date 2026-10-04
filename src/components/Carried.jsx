import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { disposeBottle, makeBottle } from '../game/bottle'
import { makeLabelTexture } from '../game/textures'
import { useStore } from '../store'

/** Desplazamiento de la botella dentro del espacio de la cámara. */
const OFFSET = new THREE.Vector3(0.24, -0.26, -0.52)
const TILT = new THREE.Euler(0.22, -0.5, -0.16)

/**
 * La botella que el jugador lleva en la mano: sigue a la cámara con
 * amortiguación para que no se sienta pegada a la vista.
 */
export function Carried() {
    const held = useStore((s) => s.held)
    const camera = useThree((s) => s.camera)
    const mesh = useRef(null)
    const position = useRef(OFFSET.clone().setY(-1.4))
    const quaternion = useRef(new THREE.Quaternion())
    const bob = useRef(0)
    const hasBottle = useRef(false)

    const texture = useMemo(() => {
        if (!held) return null
        return held.labelSpec
            ? makeLabelTexture(held.labelSpec)
            : makeLabelTexture({ a: '#00e5ff', b: '#eef5ff', ink: '#04101f', atlasRing: true })
    }, [held])

    const bottle = useMemo(() => {
        if (!held) return null
        return makeBottle({
            label: texture,
            body: held.bodyColor || '#cfeefb',
            cap: held.capColor || '#00e5ff',
            tapa: held.tapa,
            etiqueta: held.etiqueta,
        })
    }, [held, texture])

    useEffect(() => () => texture?.dispose(), [texture])
    useEffect(() => () => disposeBottle(bottle), [bottle])

    useEffect(() => {
        const parent = mesh.current
        if (!parent) return
        if (bottle) {
            if (!parent.children.includes(bottle)) parent.add(bottle)
            hasBottle.current = true
        } else if (hasBottle.current) {
            parent.clear()
            hasBottle.current = false
        }
    }, [bottle])

    const target = useMemo(() => new THREE.Vector3(), [])
    const targetQ = useMemo(() => new THREE.Quaternion(), [])
    const offsetQ = useMemo(() => new THREE.Quaternion().setFromEuler(TILT), [])

    useFrame(({ clock }, delta) => {
        const parent = mesh.current
        if (!parent) return
        target.copy(OFFSET).applyMatrix4(camera.matrixWorld)
        targetQ.copy(camera.quaternion).multiply(offsetQ)

        if (held) {
            parent.visible = true
            bob.current += delta
            const k = 1 - Math.exp(-12 * delta)
            position.current.lerp(target, k)
            quaternion.current.slerp(targetQ, k)
            // respiración suave: parece sostenida a mano y no soldada a la vista
            target.y += Math.sin(bob.current * 2.1) * 0.004
            position.current.y = THREE.MathUtils.damp(position.current.y, target.y, 12, delta)
        } else if (hasBottle.current) {
            // al registrar o soltar, cae fuera de cuadro
            position.current.y = THREE.MathUtils.damp(position.current.y, -1.4, 6, delta)
            parent.visible = position.current.y > -1.2
        } else {
            parent.visible = false
        }

        parent.position.copy(position.current)
        parent.quaternion.copy(quaternion.current)
    })

    return <group ref={mesh} visible={false} />
}