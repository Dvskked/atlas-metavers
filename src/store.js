import { create } from 'zustand'
import { SCORE, scoreFor } from './atlas/palette'

const STORAGE = 'atlas-metaverso'

function loadSaved() {
    try {
        const raw = localStorage.getItem(STORAGE)
        if (!raw) return null
        return JSON.parse(raw)
    } catch {
        return null
    }
}

function save(value) {
    try {
        localStorage.setItem(STORAGE, JSON.stringify(value))
    } catch {
        /* almacenamiento no disponible */
    }
}

/** Duración del análisis, en segundos. */
export const SCAN_TIME = 3.2

/** Confianza que el modelo YOLO devolvería para cada parte detectada. */
function fakeConfidence(bottle, part) {
    const ceiling = bottle.copy ? 0.74 : 0.99
    const floor = bottle.copy ? 0.51 : 0.86
    return floor + Math.random() * (ceiling - floor)
}

const saved = loadSaved()

export const useStore = create((set, get) => ({
    /* ---------------- navegación ---------------- */
    phase: 'menu', // menu | playing | panel | modal
    started: false,

    /* ---------------- HUD ---------------- */
    puntos: saved?.puntos ?? 0,
    recicladas: saved?.recicladas ?? 0,
    siguienteId: saved?.siguienteId ?? 1,
    ultima: saved?.ultima ?? null, // { comprobante, puntos, saldo, bottle }
    toast: null,
    aviso: null,

    /* ---------------- interacción ---------------- */
    hover: null, // { kind, label, hint }
    held: null, // botella en la mano
    onPedestal: null, // botella en la plataforma
    info: null, // id del cartel abierto

    /* ---------------- escáner ---------------- */
    scan: 'idle', // idle | scanning | done
    scanStartedAt: 0,
    detections: [], // [{ id, label, confidence, at }]
    scanned: null,
    breakdown: [],
    gained: 0,
    receipt: null,

    setPhase: (phase) => set({ phase }),
    setHover: (hover) => set({ hover }),
    setAviso: (aviso) => set({ aviso }),
    setInfo: (info) => set({ info }),

    /* ---------------- recoger / soltar ---------------- */
    pickUp: (bottle) => {
        const s = get()
        if (s.held) {
            set({ aviso: 'Ya llevas una botella en la mano.' })
            return false
        }
        set({ held: bottle, hover: null })
        return true
    },
    dropHeld: () => set({ held: null }),
    place: () => {
        const { held, onPedestal } = get()
        if (!held || onPedestal) return false
        set({
            onPedestal: held,
            held: null,
            scan: 'idle',
            scanStartedAt: 0,
            detections: [],
            scanned: null,
            breakdown: [],
            gained: 0,
            receipt: null,
        })
        return true
    },
    /** Vacía la plataforma al aceptar el comprobante. */
    consumePedestal: () =>
        set({
            onPedestal: null,
            scan: 'idle',
            scanStartedAt: 0,
            detections: [],
            scanned: null,
            breakdown: [],
            gained: 0,
            receipt: null,
        }),

    /* ---------------- escaneo ---------------- */
    startScan: () => {
        const { onPedestal } = get()
        if (!onPedestal || get().scan !== 'idle') return false
        const parts = [
            { id: 'botella', label: 'Botella PET' },
            { id: 'etiqueta', label: 'Etiqueta' },
            { id: 'tapa', label: 'Tapa' },
        ].filter((p) => p.id === 'botella' || onPedestal[p.id])

        set({
            scan: 'scanning',
            scanStartedAt: performance.now(),
            detections: parts.map((p, i) => ({ ...p, confidence: 0, at: 0.55 + i * 0.7 })),
            gained: 0,
            receipt: null,
        })
        return true
    },

    /**
     * Fin del análisis: rellena confianzas, guarda el registro y suma
     * los AtlasPuntos, igual que hace /api/registrar-reciclaje.
     */
    finishScan: () => {
        const s = get()
        const bottle = s.onPedestal
        if (!bottle || s.scan !== 'scanning') return null

        const puntos = scoreFor(bottle)
        const comprobanteId = `ATLA-${String(s.siguienteId).padStart(6, '0')}`
        const saldoAnterior = s.puntos

        const receipt = {
            comprobante: comprobanteId,
            puntos,
            saldoAnterior,
            saldoNuevo: saldoAnterior + puntos,
            bottle,
            copy: bottle.copy,
            marca: bottle.marca,
            fecha: new Date(),
        }

        const next = {
            puntos: saldoAnterior + puntos,
            recicladas: s.recicladas + 1,
            siguienteId: s.siguienteId + 1,
            ultima: {
                comprobante: comprobanteId,
                puntos,
                saldo: saldoAnterior + puntos,
                bottle: bottle.label,
                marca: bottle.marca,
                copy: bottle.copy,
            },
        }
        save(next)

        set({
            ...next,
            scan: 'done',
            phase: 'modal',
            detections: s.detections.map((d) => ({
                ...d,
                confidence: fakeConfidence(bottle, d.id),
            })),
            scanned: bottle,
            breakdown: [
                { id: 'botella', label: 'Botella PET', icon: '♻', points: SCORE.base, hit: true },
                {
                    id: 'tapa',
                    label: 'Tapa',
                    icon: '◉',
                    points: bottle.tapa ? SCORE.tapa : 0,
                    hit: bottle.tapa,
                },
                {
                    id: 'etiqueta',
                    label: 'Etiqueta',
                    icon: '▤',
                    points: bottle.etiqueta ? SCORE.etiqueta : 0,
                    hit: bottle.etiqueta,
                },
            ],
            gained: puntos,
            receipt,
            toast: { puntos, comprobante: comprobanteId, id: Date.now() },
        })
        return receipt
    },

    clearToast: () => set({ toast: null }),
    clearAviso: () => set({ aviso: null }),

    reset: () => {
        save({ puntos: 0, recicladas: 0, siguienteId: 1, ultima: null })
        set({ puntos: 0, recicladas: 0, siguienteId: 1, ultima: null })
    },
}))