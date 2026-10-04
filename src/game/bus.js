/**
 * Bus mínimo para los bocadillos de las marcas inventadas.
 * Vive fuera de zustand porque los textos cambian a 60 fps y no deben
 * provocar renders de React.
 */
const listeners = new Set()

export function onSay(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
}

export function say(payload) {
    for (const fn of listeners) fn(payload)
}

export function clearSay() {
    for (const fn of listeners) fn(null)
}