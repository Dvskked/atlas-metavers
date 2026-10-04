import * as THREE from 'three'
import { ATLAS } from '../atlas/palette'

const FONT = "'Segoe UI', system-ui, -apple-system, Roboto, sans-serif"

export function makeTex(canvas, wrap = false) {
    const texture = new THREE.CanvasTexture(canvas)
    texture.anisotropy = 4
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
    if (wrap) {
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.magFilter = THREE.LinearFilter
    }
    return texture
}

function newCanvas(w, h) {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    return [canvas, canvas.getContext('2d')]
}

function roundRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rad, y)
    ctx.arcTo(x + w, y, x + w, y + h, rad)
    ctx.arcTo(x + w, y + h, x, y + h, rad)
    ctx.arcTo(x, y + h, x, y, rad)
    ctx.arcTo(x, y, x + w, y, rad)
    ctx.closePath()
}

function fitText(ctx, text, maxWidth, weight, startPx, family = FONT) {
    let size = startPx
    do {
        ctx.font = `${weight} ${size}px ${family}`
        if (ctx.measureText(text).width <= maxWidth) break
        size -= 2
    } while (size > 10)
    return size
}

/* ------------------------------------------------------------------ */
/* Logo de Atlas: PNG real cargado una vez y cacheado                  */
/* ------------------------------------------------------------------ */

let logoPromise = null

export function loadLogo() {
    if (logoPromise) return logoPromise
    logoPromise = new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null)
        img.src = `${import.meta.env.BASE_URL}logo-atlas.png`
    })
    return logoPromise
}

/**
 * Panel con el logo real de Atlas. Se pinta de inmediato con un wordmark
 * vectorial y en cuanto carga el PNG se sustituye sobre el mismo canvas,
 * así la textura nunca aparece a medio hacer.
 */
export function makeLogoPanel(width = 1024, height = 512) {
    const [canvas, ctx] = newCanvas(width, height)
    const texture = makeTex(canvas)

    const drawVector = () => {
        const bg = ctx.createLinearGradient(0, 0, width, height)
        bg.addColorStop(0, ATLAS.bg)
        bg.addColorStop(0.55, ATLAS.bgSecondary)
        bg.addColorStop(1, ATLAS.bgDeep)
        ctx.fillStyle = bg
        ctx.fillRect(0, 0, width, height)

        ctx.strokeStyle = 'rgba(0,229,255,0.25)'
        ctx.lineWidth = 4
        ctx.strokeRect(14, 14, width - 28, height - 28)

        ctx.textAlign = 'center'
        ctx.fillStyle = ATLAS.white
        fitText(ctx, 'ATLAS', width * 0.62, 800, 190)
        ctx.shadowColor = 'rgba(0,229,255,0.6)'
        ctx.shadowBlur = 44
        ctx.fillText('ATLAS', width / 2, height * 0.52)
        ctx.shadowBlur = 0
        ctx.fillStyle = ATLAS.cyan
        ctx.font = `600 ${height * 0.085}px ${FONT}`
        ctx.fillText('RECICLAJE INTELIGENTE', width / 2, height * 0.68)
    }

    drawVector()
    texture.needsUpdate = true

    loadLogo().then((img) => {
        if (!img) return
        ctx.clearRect(0, 0, width, height)
        const bg = ctx.createLinearGradient(0, 0, width, height)
        bg.addColorStop(0, ATLAS.bg)
        bg.addColorStop(0.5, ATLAS.bgSecondary)
        bg.addColorStop(1, ATLAS.bgDeep)
        ctx.fillStyle = bg
        ctx.fillRect(0, 0, width, height)

        const glow = ctx.createRadialGradient(
            width * 0.5, height * 0.42, 0,
            width * 0.5, height * 0.42, width * 0.42,
        )
        glow.addColorStop(0, 'rgba(0,229,255,0.22)')
        glow.addColorStop(1, 'rgba(0,229,255,0)')
        ctx.fillStyle = glow
        ctx.fillRect(0, 0, width, height)

        const size = height * 0.46
        ctx.drawImage(img, width / 2 - size / 2, height * 0.1, size, size)

        ctx.textAlign = 'center'
        ctx.fillStyle = ATLAS.white
        fitText(ctx, 'ATLAS', width * 0.6, 800, height * 0.2)
        ctx.shadowColor = 'rgba(0,229,255,0.55)'
        ctx.shadowBlur = 34
        ctx.fillText('ATLAS', width / 2, height * 0.78)
        ctx.shadowBlur = 0
        texture.needsUpdate = true
    })

    return texture
}

/* ------------------------------------------------------------------ */
/* Etiquetas de las botellas                                            */
/* ------------------------------------------------------------------ */

/**
 * Etiqueta envolvente (se repite en X sobre un cilindro).
 * Las copias de marca la llenan con su wordmark; las botellas de Atlas
 * llevan una banda limpia con el an recyclable.
 */
export function makeLabelTexture({
    a,
    b,
    ink,
    word,
    sub,
    atlasRing = false,
} = {}) {
    const W = 1024
    const H = 256
    const [canvas, ctx] = newCanvas(W, H)

    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, b || '#ffffff')
    bg.addColorStop(0.5, b || '#ffffff')
    bg.addColorStop(1, a || ATLAS.cyan)
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // franja de color de marca
    ctx.fillStyle = a || ATLAS.cyan
    ctx.fillRect(0, H * 0.34, W, H * 0.34)

    // brillo diagonal sutil
    const sheen = ctx.createLinearGradient(0, 0, W, H)
    sheen.addColorStop(0, 'rgba(255,255,255,0.22)')
    sheen.addColorStop(0.45, 'rgba(255,255,255,0)')
    sheen.addColorStop(1, 'rgba(0,0,0,0.18)')
    ctx.fillStyle = sheen
    ctx.fillRect(0, 0, W, H)

    ctx.textAlign = 'center'
    if (atlasRing) {
        ctx.fillStyle = ATLAS.cyan
        ctx.font = `700 ${H * 0.16}px ${FONT}`
        ctx.fillText('♻  ATLAS  ·  PET 1', W / 2, H * 0.58)
        ctx.fillStyle = ATLAS.ink
        ctx.font = `600 ${H * 0.1}px ${FONT}`
        ctx.fillText('ENVASE RECICLABLE · SIN RESIDUOS', W / 2, H * 0.82)
    } else {
        ctx.fillStyle = ink || '#ffffff'
        const size = fitText(ctx, word, W * 0.86, 800, H * 0.28)
        ctx.fillText(word, W / 2, H * 0.57)
        if (size > 40) {
            ctx.globalAlpha = 0.8
            ctx.font = `600 ${H * 0.09}px ${FONT}`
            ctx.fillText(String(sub || '').toUpperCase(), W / 2, H * 0.8)
            ctx.globalAlpha = 1
        }
    }

    const texture = makeTex(canvas, true)
    texture.repeat.set(1, 1)
    return texture
}

/* ------------------------------------------------------------------ */
/* Escenario                                                            */
/* ------------------------------------------------------------------ */

/** Cielo nocturno: degradado azul Atlas hacia el horizonte. */
export function makeSky() {
    const W = 512
    const H = 512
    const [canvas, ctx] = newCanvas(W, H)
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#02060f')
    g.addColorStop(0.42, '#050e1c')
    g.addColorStop(0.68, '#0a1a30')
    g.addColorStop(0.82, '#102b4a')
    g.addColorStop(1, '#071426')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    return makeTex(canvas)
}

/** Campo de estrellas para el domo. */
export function makeStars() {
    const W = 1024
    const H = 512
    const [canvas, ctx] = newCanvas(W, H)
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, W, H)
    for (let i = 0; i < 900; i++) {
        const x = Math.random() * W
        const y = Math.random() * H * 0.72
        const r = Math.random() * 1.5 + 0.3
        const a = Math.random() * 0.65 + 0.12
        ctx.fillStyle = `rgba(${190 + Math.random() * 60},${225 + Math.random() * 30},255,${a})`
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
    }
    return makeTex(canvas)
}

/** Suelo del parque: losas de hormigón oscuro con juntas cyan. */
export function makeGround() {
    const S = 1024
    const [canvas, ctx] = newCanvas(S, S)

    ctx.fillStyle = '#0c1626'
    ctx.fillRect(0, 0, S, S)

    const cell = S / 8
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const shade = 0.9 + Math.random() * 0.22
            const base = Math.floor(14 * shade)
            ctx.fillStyle = `rgb(${Math.floor(11 * shade)},${Math.floor(23 * shade)},${base + 14})`
            ctx.fillRect(x * cell + 3, y * cell + 3, cell - 6, cell - 6)
        }
    }

    // grano
    for (let i = 0; i < 5200; i++) {
        const x = Math.random() * S
        const y = Math.random() * S
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`
        ctx.fillRect(x, y, 2, 2)
    }

    // juntas
    ctx.strokeStyle = 'rgba(0,229,255,0.10)'
    ctx.lineWidth = 4
    for (let i = 0; i <= 8; i++) {
        ctx.beginPath()
        ctx.moveTo(i * cell, 0)
        ctx.lineTo(i * cell, S)
        ctx.moveTo(0, i * cell)
        ctx.lineTo(S, i * cell)
        ctx.stroke()
    }

    // manchas de humedad
    for (let i = 0; i < 26; i++) {
        const x = Math.random() * S
        const y = Math.random() * S
        const r = 30 + Math.random() * 90
        const g = ctx.createRadialGradient(x, y, 0, x, y, r)
        g.addColorStop(0, 'rgba(5,14,28,0.30)')
        g.addColorStop(1, 'rgba(5,14,28,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
    }

    return makeTex(canvas, true)
}

/** Callejón central con guide-lines cyan (decal transparente). */
export function makePath() {
    const W = 512
    const H = 1024
    const [canvas, ctx] = newCanvas(W, H)

    ctx.clearRect(0, 0, W, H)

    const g = ctx.createLinearGradient(0, 0, W, 0)
    g.addColorStop(0, 'rgba(17,41,74,0)')
    g.addColorStop(0.16, 'rgba(17,41,74,0.85)')
    g.addColorStop(0.84, 'rgba(17,41,74,0.85)')
    g.addColorStop(1, 'rgba(17,41,74,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)

    // franjas de circulación
    ctx.globalAlpha = 0.5
    for (let y = 0; y < H; y += 46) {
        ctx.fillStyle = 'rgba(0,229,255,0.06)'
        ctx.fillRect(W * 0.12, y, W * 0.76, 22)
    }
    ctx.globalAlpha = 1

    // rieles laterales
    for (const x of [W * 0.115, W * 0.885]) {
        const line = ctx.createLinearGradient(0, 0, W, 0)
        line.addColorStop(0, 'rgba(0,229,255,0)')
        line.addColorStop(0.5, 'rgba(0,229,255,0.85)')
        line.addColorStop(1, 'rgba(0,229,255,0)')
        ctx.fillStyle = line
        ctx.fillRect(x - 5, 0, 10, H)
        ctx.fillStyle = 'rgba(0,229,255,0.10)'
        ctx.fillRect(x - 26, 0, 52, H)
    }

    // chevrones hacia la estación
    ctx.strokeStyle = 'rgba(77,240,255,0.34)'
    ctx.lineWidth = 8
    for (let i = 0; i < 9; i++) {
        const y = H * 0.06 + i * H * 0.105
        ctx.beginPath()
        ctx.moveTo(W * 0.3, y)
        ctx.lineTo(W * 0.5, y + H * 0.045)
        ctx.lineTo(W * 0.7, y)
        ctx.stroke()
    }

    return makeTex(canvas)
}

/** Letrero gigante pintado en el suelo frente al spawn. */
export function makeGroundLogo() {
    const W = 1024
    const H = 512
    const [canvas, ctx] = newCanvas(W, H)
    ctx.clearRect(0, 0, W, H)
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(0,229,255,0.16)'
    fitText(ctx, 'ATLAS', W * 0.8, 800, 210)
    ctx.fillText('ATLAS', W / 2, H * 0.6)
    ctx.fillStyle = 'rgba(159,182,214,0.18)'
    ctx.font = `600 54px ${FONT}`
    ctx.fillText('RED INTELIGENTE DE RECICLAJE', W / 2, H * 0.82)
    ctx.strokeStyle = 'rgba(0,229,255,0.2)'
    ctx.lineWidth = 6
    ctx.strokeRect(30, 30, W - 60, H - 60)
    return makeTex(canvas)
}

/** Pantalla de la estación: logo + estado del escáner. */
export function makeStationScreen() {
    const W = 1024
    const H = 640
    const [canvas, ctx] = newCanvas(W, H)
    const texture = makeTex(canvas)

    const paint = (img) => {
        const g = ctx.createLinearGradient(0, 0, 0, H)
        g.addColorStop(0, '#050e1c')
        g.addColorStop(0.5, '#0e2038')
        g.addColorStop(1, '#08182c')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W, H)

        // rejilla técnica
        ctx.strokeStyle = 'rgba(0,229,255,0.10)'
        ctx.lineWidth = 2
        for (let x = 0; x < W; x += 64) {
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(x, H)
            ctx.stroke()
        }
        for (let y = 0; y < H; y += 64) {
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(W, y)
            ctx.stroke()
        }

        ctx.strokeStyle = 'rgba(0,229,255,0.45)'
        ctx.lineWidth = 5
        roundRect(ctx, 18, 18, W - 36, H - 36, 18)
        ctx.stroke()

        if (img) {
            const size = H * 0.42
            ctx.drawImage(img, W / 2 - size / 2, H * 0.09, size, size)
        } else {
            ctx.textAlign = 'center'
            ctx.fillStyle = ATLAS.white
            fitText(ctx, 'ATLAS', W * 0.5, 800, 150)
            ctx.fillText('ATLAS', W / 2, H * 0.38)
        }

        ctx.textAlign = 'center'
        ctx.fillStyle = ATLAS.cyan
        ctx.font = `700 46px ${FONT}`
        ctx.fillText('ESTACIÓN DE ESCANEO', W / 2, H * 0.68)

        ctx.fillStyle = ATLAS.gray
        ctx.font = `500 30px ${FONT}`
        ctx.fillText('Coloca la botella en la plataforma', W / 2, H * 0.77)

        // LEDs de estado
        for (let i = 0; i < 5; i++) {
            const on = i < 3
            ctx.fillStyle = on ? ATLAS.cyan : 'rgba(104,127,159,0.5)'
            ctx.beginPath()
            ctx.arc(W * 0.36 + i * 40, H * 0.87, 10, 0, Math.PI * 2)
            ctx.fill()
        }
        ctx.fillStyle = ATLAS.grayDark
        ctx.textAlign = 'left'
        ctx.font = `600 26px ${FONT}`
        ctx.fillText('SISTEMA LISTO', W * 0.6, H * 0.875)

        texture.needsUpdate = true
    }

    paint(null)
    loadLogo().then(paint)
    return texture
}

/** Cartel informativo de los stands (parecido a los pósters del museo). */
export function makeStandPoster(stand) {
    const W = 768
    const H = 576
    const [canvas, ctx] = newCanvas(W, H)

    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#0e2038')
    g.addColorStop(1, '#08182c')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)

    ctx.fillStyle = stand.accent
    ctx.fillRect(0, 0, W, 118)

    ctx.fillStyle = ATLAS.ink
    ctx.textAlign = 'left'
    ctx.font = `800 84px ${FONT}`
    ctx.fillText(stand.num, 42, 88)

    ctx.font = `600 26px ${FONT}`
    ctx.fillStyle = 'rgba(4,16,31,0.72)'
    ctx.textAlign = 'right'
    ctx.fillText('ATLAS', W - 42, 84)

    ctx.fillStyle = ATLAS.white
    ctx.textAlign = 'left'
    fitText(ctx, stand.title, W - 84, 700, 52)
    ctx.fillText(stand.title, 42, 196)

    ctx.fillStyle = stand.accent
    ctx.font = `600 28px ${FONT}`
    ctx.fillText(stand.subtitle, 42, 236)

    ctx.strokeStyle = 'rgba(159,182,214,0.28)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(42, 266)
    ctx.lineTo(W - 42, 266)
    ctx.stroke()

    ctx.fillStyle = ATLAS.gray
    ctx.font = `500 27px ${FONT}`
    stand.body.forEach((line, i) => {
        wrapText(ctx, line, 42, 316 + i * 62, W - 84, 36)
    })

    ctx.fillStyle = 'rgba(0,229,255,0.55)'
    ctx.font = `600 24px ${FONT}`
    ctx.fillText('♻  RECICLA · ESCANEA · ACUMULA', 42, H - 34)

    return makeTex(canvas)
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text).split(' ')
    let line = ''
    let yy = y
    for (const word of words) {
        const test = line ? `${line} ${word}` : word
        if (ctx.measureText(test).width > maxWidth && line) {
            ctx.fillText(line, x, yy)
            line = word
            yy += lineHeight
        } else {
            line = test
        }
    }
    if (line) ctx.fillText(line, x, yy)
}

/** Cartel del catálogo junto a los stands. */
export function makeCatalogPoster() {
    const W = 768
    const H = 576
    const [canvas, ctx] = newCanvas(W, H)

    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#0e2038')
    g.addColorStop(1, '#08182c')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)

    ctx.fillStyle = '#3ee6a0'
    ctx.fillRect(0, 0, W, 118)

    ctx.fillStyle = ATLAS.ink
    ctx.textAlign = 'left'
    ctx.font = `800 84px ${FONT}`
    ctx.fillText('04', 42, 88)
    ctx.font = `600 26px ${FONT}`
    ctx.textAlign = 'right'
    ctx.fillText('ATLAS', W - 42, 84)

    ctx.fillStyle = ATLAS.white
    ctx.textAlign = 'left'
    fitText(ctx, 'Catálogo ecológico', W - 84, 700, 46)
    ctx.fillText('Catálogo ecológico', 42, 190)

    ctx.fillStyle = '#3ee6a0'
    ctx.font = `600 26px ${FONT}`
    ctx.fillText('Canjea tus AtlasPuntos', 42, 230)

    ctx.strokeStyle = 'rgba(159,182,214,0.28)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(42, 258)
    ctx.lineTo(W - 42, 258)
    ctx.stroke()

    const items = [
        ['Llaverito Atlas', '500'],
        ['Mini Maceta Ecológica', '620'],
        ['Portalápices Ecológico', '700'],
        ['Organizador de Escritorio', '850'],
        ['Figura Decorativa Atlas', '1000'],
    ]
    ctx.font = `600 30px ${FONT}`
    items.forEach(([name, cost], i) => {
        const y = 306 + i * 48
        ctx.fillStyle = ATLAS.gray
        ctx.fillText(name, 42, y)
        ctx.textAlign = 'right'
        ctx.fillStyle = '#3ee6a0'
        ctx.fillText(`${cost} pts`, W - 42, y)
        ctx.textAlign = 'left'
    })

    return makeTex(canvas)
}

/** Contenedores de reciclaje decorativos. */
export function makeBinPanel(hex, label) {
    const W = 512
    const H = 256
    const [canvas, ctx] = newCanvas(W, H)
    ctx.fillStyle = hex
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(4,16,31,0.35)'
    ctx.fillRect(0, 0, W, 46)
    ctx.fillStyle = ATLAS.white
    ctx.textAlign = 'center'
    ctx.font = `800 62px ${FONT}`
    fitText(ctx, label, W - 60, 800, 62)
    ctx.fillText(label.toUpperCase(), W / 2, 150)
    ctx.font = `600 30px ${FONT}`
    ctx.fillStyle = 'rgba(238,245,255,0.72)'
    ctx.fillText('♻  ATLAS · RECICLA', W / 2, 200)
    return makeTex(canvas)
}

/** Textura de la cinta de luz del mástil de la estación. */
export function makeRingGlow() {
    const S = 256
    const [canvas, ctx] = newCanvas(S, S)
    const g = ctx.createRadialGradient(S / 2, S / 2, S * 0.18, S / 2, S / 2, S / 2)
    g.addColorStop(0, 'rgba(0,229,255,0)')
    g.addColorStop(0.72, 'rgba(0,229,255,0.55)')
    g.addColorStop(0.86, 'rgba(180,250,255,0.95)')
    g.addColorStop(1, 'rgba(0,229,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, S, S)
    return makeTex(canvas)
}