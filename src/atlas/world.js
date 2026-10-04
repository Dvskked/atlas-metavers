import { CATALOG, COPY_BRANDS } from './brands'

export const ARENA = 17
export const WALK_BOUND = 15.6

/** Estación de escaneo: pedestal + kiosco con el logo. */
export const STATION = {
    x: 0,
    z: -9.5,
    pedestal: { x: 0, z: -9.9, top: 1.02 },
    kiosk: { z: -11.4, w: 4.6, h: 4.6 },
    deckRadius: 3.2,
}

export const SPAWN = { x: 0, z: 13 }

/** Colliders: AABB con centro + semiejes. */
export const COLLIDERS = [
    { x: 0, z: -11.4, hw: 2.35, hd: 0.3 },
    { x: 0, z: -9.9, hw: 0.85, hd: 0.85 },
    // valla perimetral
    { x: 0, z: -16.2, hw: 16.6, hd: 0.35 },
    { x: 0, z: 16.2, hw: 16.6, hd: 0.35 },
    { x: -16.2, z: 0, hw: 0.35, hd: 16.6 },
    { x: 16.2, z: 0, hw: 0.35, hd: 16.6 },
]

/** Conos: posición y silueta baja. */
export const TREES = [
    { x: -12.4, z: -12.8, s: 1.35 },
    { x: -14.6, z: -6.2, s: 1.1 },
    { x: -12.8, z: 1.6, s: 1.5 },
    { x: -14.2, z: 8.8, s: 1.2 },
    { x: -10.6, z: 14.2, s: 1.35 },
    { x: 12.4, z: -12.8, s: 1.35 },
    { x: 14.6, z: -6.2, s: 1.1 },
    { x: 12.8, z: 1.6, s: 1.5 },
    { x: 14.2, z: 8.8, s: 1.2 },
    { x: 10.6, z: 14.2, s: 1.35 },
    { x: -6.2, z: -13.6, s: 1.15 },
    { x: 6.2, z: -13.6, s: 1.15 },
    { x: -4.4, z: 12.6, s: 0.95 },
    { x: 4.4, z: 12.6, s: 0.95 },
]

TREES.forEach((t) => COLLIDERS.push({ x: t.x, z: t.z, hw: 0.35 * t.s, hd: 0.35 * t.s }))

export const LAMPS = [
    { x: -3.4, z: 11.0 },
    { x: 3.4, z: 11.0 },
    { x: -3.4, z: 4.0 },
    { x: 3.4, z: 4.0 },
    { x: -3.4, z: -3.0 },
    { x: 3.4, z: -3.0 },
]

LAMPS.forEach((l) => COLLIDERS.push({ x: l.x, z: l.z, hw: 0.22, hd: 0.22 }))

/** Puestos informativos a los lados del paseo. */
export const STAND_SPOTS = [
    { id: 'que-es', x: -6.2, z: 8.4, rot: Math.PI / 2 },
    { id: 'escaneo', x: 6.2, z: 4.4, rot: -Math.PI / 2 },
    { id: 'puntos', x: -6.2, z: -1.2, rot: Math.PI / 2 },
    { id: 'catalogo', x: 6.2, z: -6.4, rot: -Math.PI / 2 },
]

STAND_SPOTS.forEach((s) => COLLIDERS.push({ x: s.x, z: s.z, hw: 1.7, hd: 0.55 }))

export const BINS = [
    { x: -8.4, z: -12.4, hex: '#2f6bff', label: 'PET', rot: 0.4 },
    { x: -6.6, z: -13.2, hex: '#00e5ff', label: 'Vidrio', rot: -0.2 },
    { x: -10.1, z: -11.2, hex: '#3ee6a0', label: 'Metal', rot: 0.9 },
]

BINS.forEach((b) => COLLIDERS.push({ x: b.x, z: b.z, hw: 0.62, hd: 0.62 }))

/** Botellas recogibles: limpias, con marca genérica de Atlas. */
const CLEAN = [
    { x: -1.9, z: 9.4 },
    { x: 2.3, z: 8.0 },
    { x: -2.6, z: 5.6 },
    { x: 2.0, z: 2.6 },
    { x: -2.4, z: 0.2 },
    { x: 2.7, z: -2.6 },
    { x: -2.1, z: -4.4 },
    { x: 1.9, z: -6.0 },
    { x: -7.4, z: 11.6 },
    { x: 7.6, z: 1.0 },
    { x: -8.6, z: -4.4 },
    { x: 8.2, z: -10.2 },
]

/** Desperdicio: una de cada tres llega sin tapa o sin etiqueta. */
export const SPOTS = CLEAN.map((spot, i) => {
    const variant = i % 3
    return {
        id: `spot-${i}`,
        x: spot.x,
        z: spot.z,
        tapa: variant !== 1,
        etiqueta: variant !== 2,
        rot: Math.random() * Math.PI * 2,
    }
})

/** Marcas que se pasean por el paseo. */
export const WANDERERS = [
    { brand: 'koka', x: -3.0, z: 12.0 },
    { brand: 'pepsen', x: 4.4, z: 7.2 },
    { brand: 'monstel', x: -5.2, z: 3.0 },
    { brand: 'bavarif', x: 5.6, z: -1.4 },
    { brand: 'espite', x: -4.8, z: -6.4 },
    { brand: 'rebdo', x: 3.0, z: -12.6 },
    { brand: 'manzan', x: -8.8, z: 5.6 },
    { brand: 'chocolatey', x: 9.0, z: 5.0 },
]

/** Copias abandonadas por el suelo: 0 AtlasPuntos si el jugador las escanea. */
export const DROPS = [
    { brand: 'fantu', x: -6.0, z: -8.6 },
    { brand: 'sietup', x: 6.6, z: 9.0 },
    { brand: 'cifrut', x: -9.4, z: 1.4 },
    { brand: 'poderde', x: 9.4, z: -3.0 },
    { brand: 'kolverde', x: -1.0, z: 15.0 },
]

export const COPY_BOTTLES = [...WANDERERS, ...DROPS].map((w, i) => {
    const brand = COPY_BRANDS.find((b) => b.id === w.brand) || COPY_BRANDS[0]
    return {
        ...w,
        brand,
        id: `copy-${i}`,
        // las primeras son las que saltan por el paseo; el resto son tiradas
        wandering: i < WANDERERS.length,
        tapa: (i % 4) !== 3,
        etiqueta: (i % 5) !== 4,
    }
})

export { CATALOG }