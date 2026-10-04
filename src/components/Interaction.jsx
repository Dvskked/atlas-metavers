import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useStore } from '../store'
import { say } from '../game/bus'
import { sfx } from '../game/sfx'
import { COPY_LINES, STANDS } from '../atlas/brands'
import { unlockPointer } from './PointerLock'

/** malla → payload. Se rellena desde Bottles, CopyBrands, ScanStation y Park. */
export const REGISTRY = new Map()

const MAX_DISTANCE = 3.6
const raycaster = new THREE.Raycaster()
const WHITE = new THREE.Color('#ffffff')

const ACCENTS = {
    stand: new THREE.Color('#00e5ff'),
    bottle: new THREE.Color('#3ee6a0'),
    copy: new THREE.Color('#ffb648'),
    pedestal: new THREE.Color('#00e5ff'),
}

function pick(pool, exclude) {
    if (!pool || pool.length === 0) return null
    if (pool.length === 1) return pool[0]
    let choice = pool[0]
    for (let i = 0; i < 6 && choice === exclude; i++) {
        choice = pool[Math.floor(Math.random() * pool.length)]
    }
    return choice
}

function hoverFor(entry, st) {
    switch (entry.kind) {
        case 'stand': {
            const stand = STANDS.find((s) => s.id === entry.id)
            return {
                kind: 'stand',
                label: stand?.title || 'Cartel informativo',
                hint: 'Clic para leer',
            }
        }
        case 'pedestal': {
            if (st.held) {
                return st.onPedestal
                    ? { kind: 'pedestal', label: 'Plataforma ocupada', hint: null, blocked: true }
                    : {
                          kind: 'pedestal',
                          label: `Colocar ${st.held.label}`,
                          hint: 'Clic para colocar y escanear',
                      }
            }
            return {
                kind: 'pedestal',
                label: 'Estación de escaneo Atlas',
                hint: st.onPedestal ? 'Clic para abrir el escáner' : 'Vuelve con una botella',
            }
        }
        default: {
            if (st.held) {
                return { kind: entry.kind, label: 'Ya llevas una botella', hint: null, blocked: true }
            }
            return {
                kind: entry.kind,
                id: entry.id,
                label: entry.label,
                hint: 'Clic para recoger',
            }
        }
    }
}

export function Interaction() {
    const camera = useThree((s) => s.camera)
    const signature = useRef('')
    const hovered = useRef(null)

    useFrame((_, delta) => {
        const st = useStore.getState()
        const entries = [...REGISTRY.values()].filter((e) => e && e.mesh)
        if (!entries.length) return

        raycaster.setFromCamera({ x: 0, y: 0 }, camera)
        const hits = raycaster.intersectObjects(
            entries.map((e) => e.mesh),
            true,
        )

        let entry = null
        for (const hit of hits) {
            if (hit.distance > MAX_DISTANCE) break
            let node = hit.object
            while (node && !entry) {
                entry = entries.find((e) => e.mesh === node) || null
                node = node.parent
            }
            if (entry) break
        }

        hovered.current = entry

        const sig = `${entry?.id ?? '-'}::${st.held?.id ?? '-'}::${st.onPedestal?.id ?? '-'}`
        if (sig !== signature.current) {
            signature.current = sig
            st.setHover(entry ? hoverFor(entry, st) : null)
        }

        for (const e of entries) {
            const hot = e.mesh === entry
            const mat = e.mesh.material
            if (!mat || !mat.color) continue
            const target = hot ? ACCENTS[e.kind] || ACCENTS.bottle : WHITE
            mat.color.r = THREE.MathUtils.damp(mat.color.r, target.r, 12, delta)
            mat.color.g = THREE.MathUtils.damp(mat.color.g, target.g, 12, delta)
            mat.color.b = THREE.MathUtils.damp(mat.color.b, target.b, 12, delta)
            if (e.halo && mat.transparent) {
                mat.opacity = THREE.MathUtils.damp(mat.opacity, hot ? 0.6 : 0, 12, delta)
            }
        }
    })

    useEffect(() => {
        const onDown = (e) => {
            if (e.button !== 0) return
            if (!document.pointerLockElement) return
            const st = useStore.getState()
            if (st.phase !== 'playing') return

            const entry = hovered.current
            if (!entry || !REGISTRY.has(entry.id)) return

            if (entry.kind === 'stand') {
                st.setInfo(entry.id)
                st.setPhase('modal')
                unlockPointer()
                sfx('open')
                return
            }

            if (entry.kind === 'pedestal') {
                if (st.held && !st.onPedestal && st.place()) sfx('place')
                st.setPhase('panel')
                unlockPointer()
                sfx('open')
                return
            }

            if (entry.kind === 'bottle' || entry.kind === 'copy') {
                if (st.held) {
                    st.setAviso('Ya llevas una botella en la mano.')
                    return
                }
                if (st.pickUp(entry.bottle)) {
                    REGISTRY.delete(entry.id)
                    sfx('pick')
                    if (entry.kind === 'copy') {
                        say({
                            id: entry.bottle.id,
                            brand: entry.bottle.marca,
                            text: pick(COPY_LINES.tap, null),
                            ttl: 4200,
                        })
                    }
                }
            }
        }
        document.addEventListener('mousedown', onDown)
        return () => document.removeEventListener('mousedown', onDown)
    }, [])

    return null
}