/**
 * Identidad visual de Atlas.
 * Los valores de --bg-main / --cyan / --blue-deep salen de static/css/style.css
 * del sistema Flask para que el metaverso se sienta como la misma marca.
 */
export const ATLAS = {
    bgDeep: '#050e1c',
    bg: '#0a1a30',
    bgSecondary: '#0e2038',
    card: '#11294a',
    cardSoft: '#153053',
    cyan: '#00e5ff',
    cyanSoft: '#4df0ff',
    blue: '#2f6bff',
    white: '#eef5ff',
    gray: '#9fb6d6',
    grayDark: '#687f9f',
    ink: '#04101f',
}

export const ACCENT = {
    cyan: ATLAS.cyan,
    blue: ATLAS.blue,
    mint: '#3ee6a0',
    amber: '#ffb648',
    danger: '#ff6b6b',
}

/** Reglas de puntuación reales de app.py: base + tapa + etiqueta. */
export const SCORE = {
    base: 50,
    tapa: 10,
    etiqueta: 5,
}

export function scoreFor(bottle) {
    if (!bottle) return 0
    return (
        SCORE.base +
        (bottle.tapa ? SCORE.tapa : 0) +
        (bottle.etiqueta ? SCORE.etiqueta : 0)
    )
}

export function scoreBreakdown(bottle) {
    if (!bottle) return []
    const rows = [
        { id: 'botella', label: 'Botella PET', icon: '♻', points: SCORE.base, hit: true },
        {
            id: 'tapa',
            label: 'Tapa presente',
            icon: '◉',
            points: bottle.tapa ? SCORE.tapa : 0,
            hit: Boolean(bottle.tapa),
        },
        {
            id: 'etiqueta',
            label: 'Etiqueta presente',
            icon: '▤',
            points: bottle.etiqueta ? SCORE.etiqueta : 0,
            hit: Boolean(bottle.etiqueta),
        },
    ]
    return rows
}

/** Formato de comprobante: "ATLA-" + id_analisis con 6 dígitos. */
export function comprobante(id) {
    return `ATLA-${String(id).padStart(6, '0')}`
}