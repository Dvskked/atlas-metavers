import * as THREE from 'three'

/**
 * Perfil de una botella PET de 500 ml en metros.
 * Se usa LatheGeometry para conseguir la silueta real: base, cuerpo, hombro,
 * cuello y rosca de la tapa.
 */
const PROFILE = [
    [0.0, 0.0],
    [0.026, 0.0],
    [0.031, 0.004],
    [0.034, 0.014],
    [0.037, 0.036],
    [0.0385, 0.062],
    [0.0385, 0.104],
    [0.0375, 0.128],
    [0.032, 0.146],
    [0.021, 0.161],
    [0.0155, 0.172],
    [0.0142, 0.196],
    [0.0142, 0.226],
    [0.0165, 0.233],
    [0.0175, 0.242],
    [0.0135, 0.248],
    [0.0, 0.249],
]

export const BOTTLE = {
    height: 0.249,
    bodyRadius: 0.0385,
    labelBottom: 0.045,
    labelTop: 0.112,
    capBottom: 0.228,
    capTop: 0.262,
    capRadius: 0.019,
}

let cached = null

export function bottleGeometries() {
    if (cached) return cached
    const points = PROFILE.map(([x, y]) => new THREE.Vector2(x, y))
    cached = {
        // cuerpo completo con cuello
        shell: new THREE.LatheGeometry(points, 28),
        // variante ancha para copias "gaseosa grande"
        liquid: new THREE.LatheGeometry(
            PROFILE.filter(([, y]) => y <= 0.2).map(([x, y]) => new THREE.Vector2(x * 0.9, y)),
            24,
        ),
        label: new THREE.CylinderGeometry(0.0394, 0.0394, 0.062, 28, 1, true),
        cap: new THREE.CylinderGeometry(0.0192, 0.0186, 0.03, 20),
        capTop: new THREE.CylinderGeometry(0.0182, 0.0182, 0.004, 20),
        ring: new THREE.TorusGeometry(0.0168, 0.0022, 6, 20),
    }
    cached.shell.computeVertexNormals()
    cached.liquid.computeVertexNormals()
    return cached
}

/**
 * Construye una botella completa como THREE.Group.
 * Las partes quedan etiquetadas con userData.part porque el escáner de Atlas
 * necesita dibujar una caja alrededor de cada una (botella / tapa / etiqueta).
 */
export function makeBottle({ label, body, cap, ink, tapa = true, etiqueta = true, glow = false }) {
    const geo = bottleGeometries()
    const group = new THREE.Group()

    const shellMat = new THREE.MeshPhysicalMaterial({
        color: body || '#cfeefb',
        transparent: true,
        opacity: 0.55,
        roughness: 0.18,
        metalness: 0.0,
        clearcoat: 0.9,
        clearcoatRoughness: 0.15,
        emissive: glow ? body || '#00e5ff' : '#000000',
        emissiveIntensity: glow ? 0.22 : 0,
        side: THREE.DoubleSide,
    })
    const shell = new THREE.Mesh(geo.shell, shellMat)
    shell.position.y = 0
    shell.userData.part = 'botella'
    group.add(shell)

    if (etiqueta) {
        const labelMat = new THREE.MeshStandardMaterial({
            map: label || null,
            color: label ? '#ffffff' : '#d8e8f4',
            roughness: 0.55,
            metalness: 0.05,
            side: THREE.DoubleSide,
            emissive: glow ? '#00e5ff' : '#000000',
            emissiveIntensity: glow ? 0.12 : 0,
        })
        const band = new THREE.Mesh(geo.label, labelMat)
        band.position.y = (BOTTLE.labelBottom + BOTTLE.labelTop) / 2
        band.userData.part = 'etiqueta'
        group.add(band)
    }

    if (tapa) {
        const capMat = new THREE.MeshStandardMaterial({
            color: cap || '#00e5ff',
            roughness: 0.42,
            metalness: 0.15,
            emissive: glow ? cap || '#00e5ff' : '#000000',
            emissiveIntensity: glow ? 0.28 : 0,
        })
        const capMesh = new THREE.Mesh(geo.cap, capMat)
        capMesh.position.y = (BOTTLE.capBottom + BOTTLE.capTop) / 2
        capMesh.userData.part = 'tapa'
        group.add(capMesh)

        const top = new THREE.Mesh(geo.capTop, capMat)
        top.position.y = BOTTLE.capTop
        top.userData.part = 'tapa'
        group.add(top)

        const thread = new THREE.Mesh(geo.ring, capMat)
        thread.rotation.x = Math.PI / 2
        thread.position.y = BOTTLE.capBottom + 0.004
        thread.userData.part = 'tapa'
        group.add(thread)
    }

    // el líquido dentro da cuerpo y color a la botella
    if (body) {
        const liquidMat = new THREE.MeshStandardMaterial({
            color: body,
            roughness: 0.3,
            metalness: 0,
            transparent: true,
            opacity: 0.72,
        })
        const liquid = new THREE.Mesh(geo.liquid, liquidMat)
        liquid.position.y = 0.012
        liquid.scale.set(0.98, 0.86, 0.98)
        liquid.userData.part = 'botella'
        group.add(liquid)
    }

    group.userData.ink = ink || '#04101f'
    return group
}

/**
 * Libera materiales y texturas de una botella.
 * La geometría es compartida (bottleGeometries) y no se toca.
 */
export function disposeBottle(group) {
    if (!group || typeof group.traverse !== 'function') return
    group.traverse((o) => {
        if (!o.isMesh) return
        const materials = Array.isArray(o.material) ? o.material : [o.material]
        for (const m of materials) {
            if (!m) continue
            m.map?.dispose?.()
            m.dispose?.()
        }
    })
}