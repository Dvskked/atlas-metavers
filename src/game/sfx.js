/**
 * Sintetizador de efectos con WebAudio. Sin archivos: todo son osciladores.
 */
let ctxCache = null

function context() {
    if (ctxCache) return ctxCache
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    if (!AC._atlas) AC._atlas = new AC()
    ctxCache = AC._atlas
    return ctxCache
}

function tone(freq, { type = 'sine', dur = 0.18, gain = 0.14, slide = 0, delay = 0 } = {}) {
    const ctx = context()
    if (!ctx) return
    try {
        if (ctx.state === 'suspended') ctx.resume()
    } catch {
        /* el navegador puede bloquear el audio hasta la primera interacción */
    }
    const t0 = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur)
    env.gain.setValueAtTime(0.0001, t0)
    env.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(env)
    env.connect(ctx.destination)
    osc.start(t0)
    osc.stop(t0 + dur + 0.05)
}

export function sfx(kind) {
    switch (kind) {
        case 'pick':
            tone(520, { type: 'triangle', dur: 0.1, gain: 0.1 })
            tone(780, { type: 'triangle', dur: 0.12, gain: 0.08, delay: 0.06 })
            break
        case 'place':
            tone(300, { type: 'sine', dur: 0.14, gain: 0.11 })
            tone(180, { type: 'sine', dur: 0.16, gain: 0.09, delay: 0.03 })
            break
        case 'scan':
            tone(880, { type: 'square', dur: 0.05, gain: 0.05 })
            break
        case 'scanDone':
            tone(660, { type: 'sine', dur: 0.1, gain: 0.09 })
            tone(990, { type: 'sine', dur: 0.12, gain: 0.08, delay: 0.07 })
            break
        case 'points':
            tone(523, { type: 'triangle', dur: 0.1, gain: 0.11 })
            tone(659, { type: 'triangle', dur: 0.1, gain: 0.1, delay: 0.08 })
            tone(784, { type: 'triangle', dur: 0.18, gain: 0.11, delay: 0.16 })
            break
        case 'reject':
            tone(220, { type: 'sawtooth', dur: 0.22, gain: 0.1, slide: -120 })
            break
        case 'copy':
            tone(420, { type: 'square', dur: 0.07, gain: 0.06 })
            tone(300, { type: 'square', dur: 0.09, gain: 0.05, delay: 0.06 })
            break
        case 'hop':
            tone(600 + Math.random() * 260, { type: 'sine', dur: 0.05, gain: 0.025 })
            break
        case 'open':
            tone(440, { type: 'sine', dur: 0.08, gain: 0.06, slide: 180 })
            break
        default:
            tone(440, { type: 'sine', dur: 0.1, gain: 0.06 })
    }
}