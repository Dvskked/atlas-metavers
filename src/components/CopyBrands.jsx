import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { disposeBottle, makeBottle } from '../game/bottle'
import { makeLabelTexture } from '../game/textures'
import { COPY_LINES } from '../atlas/brands'
import { COLLIDERS, COPY_BOTTLES } from '../atlas/world'
import { useStore } from '../store'
import { onSay, say } from '../game/bus'
import { sfx } from '../game/sfx'
import { REGISTRY } from './Interaction'
import { makeHalo } from './Bottles'

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const AREA = { minX: -14.5, maxX: 14.5, minZ: -14.5, maxZ: 14.5 }

/** Empuja la botella fuera de los obstáculos del parque. */
function avoid(x, z, radius = 0.4) {
    for (const c of COLLIDERS) {
        const dx = clamp(x - c.x, -c.hw, c.hw)
        const dz = clamp(z - c.z, -c.hd, c.hd)
        const vx = x - c.x - dx
        const vz = z - c.z - dz
        const l = Math.hypot(vx, vz)
        if (l < radius) {
            const push = (radius - l) / (l || 1)
            x += vx * push
            z += vz * push
        }
    }
    return [clamp(x, AREA.minX, AREA.maxX), clamp(z, AREA.minZ, AREA.maxZ)]
}

function pick(pool, exclude) {
    let choice = pool[0]
    for (let i = 0; i < 6 && choice === exclude; i++) {
        choice = pool[Math.floor(Math.random() * pool.length)]
    }
    return choice
}

function shortestAngle(from, to) {
    let d = to - from
    while (d > Math.PI) d -= Math.PI * 2
    while (d < -Math.PI) d += Math.PI * 2
    return d
}

/**
 * Un paso de deambulación: destino, huida del jugador y salto con
 * squash & stretch. Es el equivalente al FSM que movía a los NPC antes,
 * ahora sobre patas de botella.
 */
function stepCopy(data, state, mesh, camera, delta) {
    const dx = camera.position.x - state.x
    const dz = camera.position.z - state.z
    const dist = Math.hypot(dx, dz) || 1
    const scared = dist < 4.4
    state.cooldown = Math.max(0, state.cooldown - delta)

    state.next -= delta
    if (state.next <= 0) {
        if (scared) {
            state.gx = clamp(state.x - (dx / dist) * 9, AREA.minX, AREA.maxX)
            state.gz = clamp(state.z - (dz / dist) * 9, AREA.minZ, AREA.maxZ)
            state.next = 0.7 + Math.random() * 0.6
        } else {
            const a = Math.random() * Math.PI * 2
            const r = 3 + Math.random() * 5
            state.gx = clamp(state.x + Math.cos(a) * r, AREA.minX, AREA.maxX)
            state.gz = clamp(state.z + Math.sin(a) * r, AREA.minZ, AREA.maxZ)
            state.next = 2.5 + Math.random() * 3.5
        }
    }

    const mx = state.gx - state.x
    const mz = state.gz - state.z
    const ml = Math.hypot(mx, mz)
    const target = scared ? 3.0 : 0.85
    state.speed = THREE.MathUtils.damp(state.speed, ml > 0.4 ? target : 0, 5, delta)

    if (ml > 0.05 && state.speed > 0.02) {
        state.dir = Math.atan2(mx, mz)
        const step = Math.min(state.speed * delta, ml)
        const [nx, nz] = avoid(state.x + (mx / ml) * step, state.z + (mz / ml) * step)
        state.x = nx
        state.z = nz
    }

    const moving = state.speed > 0.25
    state.hopPhase += delta * (scared ? 9 : 5.2)
    if (state.hopPhase >= Math.PI) {
        state.hopPhase -= Math.PI
        if (moving && !scared && Math.random() < 0.45) sfx('hop')
    }
    const hop = moving ? Math.abs(Math.sin(state.hopPhase)) * (scared ? 0.3 : 0.17) : 0
    const squash = moving ? Math.cos(state.hopPhase * 2) * 0.08 : 0

    const k = 1 - Math.exp(-14 * delta)
    mesh.position.x += (state.x - mesh.position.x) * k
    mesh.position.z += (state.z - mesh.position.z) * k
    mesh.position.y = 0.02 + hop
    mesh.rotation.y += shortestAngle(mesh.rotation.y, state.dir) * (1 - Math.exp(-11 * delta))
    mesh.rotation.z = -squash * 0.45
    mesh.scale.set(1 + squash, 1 - squash * 1.25, 1 + squash)

    // Al acercarse el jugador, suelta su frase de huida.
    if (scared && !state.saidFlee) {
        state.saidFlee = true
        state.lastLine = pick(COPY_LINES.flee, state.lastLine)
        say({ id: data.id, marca: data.brand.full, text: state.lastLine, ttl: 3400 })
        sfx('copy')
    }
    if (!scared) state.saidFlee = false

    if (!scared && state.cooldown <= 0 && Math.random() < delta * 0.25) {
        state.lastLine = pick(COPY_LINES.idle, state.lastLine)
        say({ id: data.id, marca: data.brand.full, text: state.lastLine, ttl: 4600 })
        state.cooldown = 6 + Math.random() * 6
    }
}

/**
 * Una botella de marca inventada: el relevo de los NPC del metaverso.
 * Las que vagan saltan por el paseo, se asustan si te acercas y sueltan
 * su rollo en un bocadillo mientras deambulan.
 */
function CopyBottle({ data }) {
    const held = useStore((s) => s.held)
    const taken = held?.id === data.id

    const texture = useMemo(
        () =>
            makeLabelTexture({
                a: data.brand.body,
                b: data.brand.band,
                ink: data.brand.ink,
                word: data.brand.word,
                sub: data.brand.claim,
            }),
        [data],
    )

    const group = useMemo(
        () =>
            makeBottle({
                label: texture,
                body: data.brand.body,
                cap: data.brand.cap,
                ink: data.brand.ink,
                tapa: data.tapa,
                etiqueta: data.etiqueta,
            }),
        [texture, data],
    )

    const halo = useMemo(() => makeHalo(), [])
    const body = useRef(null)
    const bubble = useRef(null)
    const projected = useMemo(() => new THREE.Vector3(), [])

    const state = useMemo(
        () => ({
            x: data.x,
            z: data.z,
            gx: data.x,
            gz: data.z,
            dir: 0,
            next: 1 + Math.random() * 2,
            speed: 0,
            hopPhase: Math.random() * Math.PI,
            lastLine: null,
            saidFlee: false,
            cooldown: Math.random() * 4,
        }),
        [data],
    )

    const label = `${data.brand.full} · ${data.brand.claim}`

    useLayoutEffect(() => {
        REGISTRY.set(data.id, {
            id: data.id,
            kind: 'copy',
            halo: true,
            mesh: halo,
            label,
            bottle: {
                id: data.id,
                label,
                tapa: data.tapa,
                etiqueta: data.etiqueta,
                copy: true,
                marca: data.brand.full,
                bodyColor: data.brand.body,
                capColor: data.brand.cap,
                labelSpec: {
                    a: data.brand.body,
                    b: data.brand.band,
                    ink: data.brand.ink,
                    word: data.brand.word,
                    sub: data.brand.claim,
                },
            },
        })
        return () => REGISTRY.delete(data.id)
    }, [data, halo, label])

    useEffect(
        () => () => {
            disposeBottle(group)
            texture.dispose()
            halo.geometry.dispose()
            halo.material.dispose()
        },
        [group, texture, halo],
    )

    /* Bocadillo: DOM imperativo anclado a la botella cada frame. */
    useEffect(() => {
        const el = document.createElement('div')
        el.className = 'copy-bubble is-hidden'
        const badge = document.createElement('span')
        badge.className = 'copy-bubble-brand'
        const text = document.createElement('p')
        el.append(badge, text)
        document.body.appendChild(el)
        bubble.current = { el, badge, text, until: 0 }
        return () => el.remove()
    }, [])

    useEffect(
        () =>
            onSay((payload) => {
                if (!payload || payload.id !== data.id) return
                const b = bubble.current
                if (!b) return
                b.badge.textContent = String(payload.marca || data.brand.full).toUpperCase()
                b.text.textContent = payload.text || ''
                b.until = performance.now() + (payload.ttl || 4000)
            }),
        [data.id, data.brand],
    )

    useEffect(
        () =>
            onSay((payload) => {
                if (!payload || payload.id !== data.id) return
                state.lastLine = payload.text
                state.cooldown = (payload.ttl || 4000) / 1000
            }),
        [data.id, state],
    )

    useFrame(({ clock, camera }, delta) => {
        if (taken || !body.current) return
        if (useStore.getState().phase !== 'playing') return

        if (!data.wandering) {
            // Las tiradas por el suelo solo respiran.
            const t = clock.elapsedTime
            body.current.position.y = 0.02 + Math.sin(t * 1.4 + data.x) * 0.008
            body.current.rotation.y += delta * 0.12
        } else {
            stepCopy(data, state, body.current, camera, delta)
        }

        // Anclar el bocadillo a la botella.
        const b = bubble.current
        if (b && b.until > performance.now()) {
            projected
                .set(body.current.position.x, body.current.position.y + 0.46, body.current.position.z)
                .project(camera)
            const onScreen = projected.z < 1
            b.el.style.left = `${(projected.x * 0.5 + 0.5) * window.innerWidth}px`
            b.el.style.top = `${(-projected.y * 0.5 + 0.5) * window.innerHeight}px`
            b.el.classList.toggle('is-hidden', !onScreen)
        } else if (b) {
            b.el.classList.add('is-hidden')
        }
    })

    if (taken) return null

    const scale = data.wandering ? 1.7 : 1.8

    return (
        <group ref={body} position={[data.x, 0.02, data.z]} scale={scale}>
            <primitive object={group} />
            <primitive object={halo} scale={1 / scale} />
            <mesh position={[0, -0.02 / scale, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.13, 20]} />
                <meshBasicMaterial
                    color={data.brand.body}
                    transparent
                    opacity={0.2}
                    depthWrite={false}
                />
            </mesh>
        </group>
    )
}

/** Al registrar una copia, su marca intenta defender su reputación. */
function CopyRewardListener() {
    const scanned = useStore((s) => s.scanned)
    useEffect(() => {
        if (!scanned?.copy) return
        say({
            id: scanned.id,
            marca: scanned.marca,
            text: pick(COPY_LINES.scanned, null),
            ttl: 4600,
        })
    }, [scanned])
    return null
}

export function CopyBrands() {
    return (
        <group>
            {COPY_BOTTLES.map((data) => (
                <CopyBottle key={data.id} data={data} />
            ))}
            <CopyRewardListener />
        </group>
    )
}