import { useEffect, useRef, useState } from 'react'
import { SCORE } from './atlas/palette'
import { CATALOG, STANDS } from './atlas/brands'
import { SCAN_TIME, useStore } from './store'
import { lockPointer } from './components/PointerLock'
import { sfx } from './game/sfx'

const LOGO = `${import.meta.env.BASE_URL}logo-atlas.png`

function Logo({ className = '' }) {
    return <img className={`brand-logo ${className}`} src={LOGO} alt="Atlas" />
}

function formatDate(date) {
    if (!date) return ''
    return date.toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

/* ---------------------------------------------------------------- */
/* Menú de entrada                                                   */
/* ---------------------------------------------------------------- */

function MainMenu() {
    const setPhase = useStore((s) => s.setPhase)
    const puntos = useStore((s) => s.puntos)
    const recicladas = useStore((s) => s.recicladas)
    const setInfo = useStore((s) => s.setInfo)

    return (
        <div className="menu">
            <div className="panel">
                <Logo />
                <h1 className="panel-title">ATLAS</h1>
                <p className="subtitle">
                    Red inteligente de reciclaje. Recoge una botella PET, escanéalas en la estación y
                    acumula AtlasPuntos.
                </p>

                <ul className="controls">
                    <li>
                        <kbd>W</kbd>
                        <kbd>A</kbd>
                        <kbd>S</kbd>
                        <kbd>D</kbd> Moverse
                    </li>
                    <li>
                        <kbd>Shift</kbd> Correr
                    </li>
                    <li>
                        <kbd>Clic</kbd> Recoger · colocar · leer
                    </li>
                    <li>
                        <kbd>Espacio</kbd> Saltar
                    </li>
                    <li>
                        <kbd>Esc</kbd> Liberar el ratón
                    </li>
                </ul>

                {(puntos > 0 || recicladas > 0) && (
                    <div className="menu-stats">
                        <div>
                            <span>AtlasPuntos</span>
                            <strong>{puntos}</strong>
                        </div>
                        <div>
                            <span>Botellas</span>
                            <strong>{recicladas}</strong>
                        </div>
                    </div>
                )}

                <div className="menu-actions">
                    <button
                        type="button"
                        className="start"
                        onClick={() => {
                            setPhase('playing')
                            lockPointer()
                        }}
                    >
                        Entrar al parque
                    </button>
                    <button
                        type="button"
                        className="ghost"
                        onClick={() => {
                            setInfo('que-es')
                            setPhase('modal')
                        }}
                    >
                        Cómo funciona
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ---------------------------------------------------------------- */
/* HUD                                                               */
/* ---------------------------------------------------------------- */

function Hud() {
    const puntos = useStore((s) => s.puntos)
    const recicladas = useStore((s) => s.recicladas)
    const held = useStore((s) => s.held)
    const onPedestal = useStore((s) => s.onPedestal)
    const ultima = useStore((s) => s.ultima)

    return (
        <div className="hud-bar">
            <div className="hud-brand">
                <Logo />
                <div>
                    <strong>ATLAS</strong>
                    <span>Parque de reciclaje</span>
                </div>
            </div>

            <div className="hud-right">
                <div className="hud-wallet">
                    <span className="hud-label">AtlasPuntos</span>
                    <strong>{puntos.toLocaleString('es-CO')}</strong>
                    <small>
                        {recicladas} botella{recicladas === 1 ? '' : 's'} registrada
                        {recicladas === 1 ? '' : 's'}
                    </small>
                </div>
                {ultima && (
                    <div className="hud-receipt">
                        <span>Último comprobante</span>
                        <strong>{ultima.comprobante}</strong>
                    </div>
                )}
            </div>

            <div className="hud-hand">
                {held ? (
                    <>
                        <span className="hud-label">En la mano</span>
                        <strong>{held.label}</strong>
                        <small>
                            {held.copy
                                ? `Marca ${held.marca} · Atlas no verifica marcas`
                                : `${SCORE.base}${held.tapa ? ` + ${SCORE.tapa}` : ''}${
                                      held.etiqueta ? ` + ${SCORE.etiqueta}` : ''
                                  } AtlasPuntos`}
                        </small>
                    </>
                ) : onPedestal ? (
                    <>
                        <span className="hud-label">En la plataforma</span>
                        <strong>{onPedestal.label}</strong>
                        <small>Acércate a la estación y pulsa Escanear botella</small>
                    </>
                ) : (
                    <>
                        <span className="hud-label">Manos vacías</span>
                        <strong>Busca una botella</strong>
                        <small>Las que brillan se pueden recoger</small>
                    </>
                )}
            </div>

            <div className="hud-hint">ESC para liberar el ratón</div>
        </div>
    )
}

/* ---------------------------------------------------------------- */
/* Avisos                                                            */
/* ---------------------------------------------------------------- */

function Toast() {
    const toast = useStore((s) => s.toast)
    const clearToast = useStore((s) => s.clearToast)
    const timer = useRef(null)

    useEffect(() => {
        if (!toast) return undefined
        timer.current = setTimeout(clearToast, 4200)
        return () => clearTimeout(timer.current)
    }, [toast, clearToast])

    if (!toast) return null
    return (
        <div className="toast" key={toast.id}>
            <span className="toast-icon">♻</span>
            <div>
                <strong>+{toast.puntos} AtlasPuntos</strong>
                <small>{toast.comprobante}</small>
            </div>
        </div>
    )
}

function Aviso() {
    const aviso = useStore((s) => s.aviso)
    const clearAviso = useStore((s) => s.clearAviso)

    useEffect(() => {
        if (!aviso) return undefined
        const t = setTimeout(clearAviso, 2600)
        return () => clearTimeout(t)
    }, [aviso, clearAviso])

    if (!aviso) return null
    return <div className="aviso">{aviso}</div>
}

/* ---------------------------------------------------------------- */
/* Panel del escáner                                                 */
/* ---------------------------------------------------------------- */

function ScannerPanel({ onClose }) {
    const onPedestal = useStore((s) => s.onPedestal)
    const scan = useStore((s) => s.scan)
    const startedAt = useStore((s) => s.scanStartedAt)
    const detections = useStore((s) => s.detections)
    const receipt = useStore((s) => s.receipt)
    const breakdown = useStore((s) => s.breakdown)
    const held = useStore((s) => s.held)
    const startScan = useStore((s) => s.startScan)
    const place = useStore((s) => s.place)

    const scanning = scan === 'scanning'
    const done = scan === 'done'
    const progress = startedAt
        ? Math.min(1, (performance.now() - startedAt) / 1000 / SCAN_TIME)
        : done
          ? 1
          : 0

    return (
        <div className="scanner">
            <div className="scanner-card">
                <header className="scanner-head">
                    <div>
                        <span className="card-label">ESCÁNER IA</span>
                        <h2>Estación de escaneo Atlas</h2>
                        <p>
                            {scanning
                                ? 'La inteligencia artificial está procesando la imagen.'
                                : done
                                  ? 'Análisis completado. El registro ya está guardado.'
                                  : 'Coloca una botella en la plataforma y pulsa «Escanear botella».'}
                        </p>
                    </div>
                    <div className={`ai-status${scanning ? ' busy' : done ? ' ok' : ''}`}>
                        <span className="status-dot" />
                        <span>
                            {scanning
                                ? 'Analizando'
                                : done
                                  ? 'Identificado'
                                  : onPedestal
                                    ? 'Botella detectada'
                                    : 'Cámara lista'}
                        </span>
                    </div>
                </header>

                <div className={`scanner-view${scanning ? ' is-scanning' : ''}`}>
                    <div className="view-grid" />
                    <div className="view-frame">
                        <span className="corner tl" />
                        <span className="corner tr" />
                        <span className="corner bl" />
                        <span className="corner br" />
                    </div>
                    {scanning && <div className="scan-line" />}

                    {!onPedestal && !scanning && !done && (
                        <div className="view-empty">
                            <span className="view-empty-icon">⌁</span>
                            <strong>Plataforma vacía</strong>
                            <small>
                                {held
                                    ? 'Coloca la botella que llevas en la mano.'
                                    : 'Vuelve al parque y recoge una botella.'}
                            </small>
                            {held && (
                                <button
                                    type="button"
                                    className="btn secondary"
                                    onClick={() => {
                                        place()
                                        sfx('place')
                                    }}
                                >
                                    Colocar en la plataforma
                                </button>
                            )}
                        </div>
                    )}

                    {onPedestal && !scanning && !done && (
                        <div className="view-bottle">
                            <div className="view-bottle-glow" />
                            <strong>{onPedestal.label}</strong>
                            <small>Lista para analizar</small>
                        </div>
                    )}

                    {scanning && (
                        <div className="view-progress">
                            <div className="view-progress-bar">
                                <span style={{ width: `${progress * 100}%` }} />
                            </div>
                            <small>Analizando la botella…</small>
                        </div>
                    )}

                    {done && (
                        <div className="view-done">
                            <span className="tick">✓</span>
                            <strong>Registro completado</strong>
                        </div>
                    )}
                </div>

                {(scanning || done) && (
                    <div className="detections">
                        <span className="card-label">RESULTADO DEL ANÁLISIS</span>
                        <div className="detections-list">
                            {detections.map((d) => (
                                <div className="detection" key={d.id}>
                                    <span className="detection-name">{d.label}</span>
                                    <span className="detection-bar">
                                        <i style={{ width: `${(d.confidence || progress) * 100}%` }} />
                                    </span>
                                    <span className="detection-conf">
                                        {d.confidence ? `${(d.confidence * 100).toFixed(1)}%` : '···'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {done ? (
                    <div className="scanner-result">
                        <div className="result-points">
                            <span>AtlasPuntos</span>
                            <strong>+{receipt?.puntos ?? 0}</strong>
                        </div>
                        <div className="result-rules">
                            {breakdown.map((row) => (
                                <div key={row.id} className={`rule${row.hit ? '' : ' miss'}`}>
                                    <span className="rule-icon">{row.icon}</span>
                                    <span>{row.label}</span>
                                    <strong>{row.points > 0 ? `+${row.points}` : '—'}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="scanner-actions">
                        <div className="preview-points">
                            <span className="card-label">PREVISIÓN</span>
                            <strong>
                                {onPedestal
                                    ? `${SCORE.base}${onPedestal.tapa ? ` + ${SCORE.tapa}` : ''}${
                                          onPedestal.etiqueta ? ` + ${SCORE.etiqueta}` : ''
                                      }`
                                    : '—'}
                            </strong>
                            <small>AtlasPuntos</small>
                        </div>
                        <button
                            type="button"
                            className="btn primary"
                            disabled={!onPedestal || scanning}
                            onClick={() => startScan()}
                        >
                            {scanning ? 'Analizando…' : '⌁  Escanear botella'}
                        </button>
                    </div>
                )}

                <button type="button" className="scanner-close" onClick={onClose} disabled={scanning}>
                    Volver al parque
                </button>
            </div>
        </div>
    )
}

/* ---------------------------------------------------------------- */
/* Comprobante de registro                                           */
/* ---------------------------------------------------------------- */

function ReceiptModal() {
    const receipt = useStore((s) => s.receipt)
    const info = useStore((s) => s.info)
    const consumePedestal = useStore((s) => s.consumePedestal)
    const setPhase = useStore((s) => s.setPhase)

    const accept = () => {
        consumePedestal()
        setPhase('playing')
        lockPointer()
    }

    if (!receipt || info) return null

    return (
        <div className="modal">
            <div className="modal-card receipt">
                <div className="modal-icon success">♻</div>
                <h2>Botella registrada</h2>
                <p>
                    {receipt.copy
                        ? `Registro guardado. La marca ${receipt.marca} no está verificada por Atlas: el escáner evalúa el material, no la marca.`
                        : 'Tu botella fue registrada correctamente y el saldo ya está actualizado.'}
                </p>

                <div className="receipt-total">
                    <span>AtlasPuntos obtenidos</span>
                    <strong>+{receipt.puntos}</strong>
                </div>

                <dl className="receipt-rows">
                    <div>
                        <dt>Comprobante</dt>
                        <dd>{receipt.comprobante}</dd>
                    </div>
                    <div>
                        <dt>Fecha</dt>
                        <dd>{formatDate(receipt.fecha)}</dd>
                    </div>
                    <div>
                        <dt>Envase</dt>
                        <dd>{receipt.bottle.label}</dd>
                    </div>
                    {receipt.copy && (
                        <div>
                            <dt>Marca</dt>
                            <dd>{receipt.marca} · sin verificar</dd>
                        </div>
                    )}
                    <div>
                        <dt>Estado</dt>
                        <dd className="ok">IDENTIFICADO</dd>
                    </div>
                    <div>
                        <dt>Saldo anterior</dt>
                        <dd>{receipt.saldoAnterior}</dd>
                    </div>
                    <div>
                        <dt>Saldo nuevo</dt>
                        <dd className="ok">{receipt.saldoNuevo}</dd>
                    </div>
                </dl>

                <button type="button" className="btn primary" onClick={accept}>
                    Aceptar
                </button>
            </div>
        </div>
    )
}

/* ---------------------------------------------------------------- */
/* Carteles informativos + catálogo                                   */
/* ---------------------------------------------------------------- */

function InfoModal() {
    const info = useStore((s) => s.info)
    const receipt = useStore((s) => s.receipt)
    const setInfo = useStore((s) => s.setInfo)
    const setPhase = useStore((s) => s.setPhase)
    const puntos = useStore((s) => s.puntos)

    const close = () => {
        setInfo(null)
        setPhase('playing')
        lockPointer()
    }

    if (!info || receipt) return null

    const stand = STANDS.find((s) => s.id === info)
    const isCatalog = info === 'catalogo'

    return (
        <div className="modal">
            <div className="modal-card exhibit">
                <div className="exhibit-band" style={{ background: stand?.accent || '#3ee6a0' }}>
                    <span>{isCatalog ? '04' : stand?.num}</span>
                    <Logo />
                </div>
                <h2>{isCatalog ? 'Catálogo ecológico' : stand?.title}</h2>
                <p className="exhibit-sub">{isCatalog ? 'Canjea tus AtlasPuntos' : stand?.subtitle}</p>

                {isCatalog ? (
                    <>
                        <div className="catalog">
                            {CATALOG.map((item) => (
                                <div
                                    className={`catalog-item${puntos >= item.cost ? '' : ' locked'}`}
                                    key={item.id}
                                >
                                    <img
                                        src={`${import.meta.env.BASE_URL}catalogo/${item.img}`}
                                        alt={item.name}
                                        loading="lazy"
                                    />
                                    <div>
                                        <strong>{item.name}</strong>
                                        <span>{item.cost} AtlasPuntos</span>
                                    </div>
                                    <span className="catalog-state">
                                        {puntos >= item.cost
                                            ? 'Disponible'
                                            : `Faltan ${item.cost - puntos}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="exhibit-lead">
                            Saldo actual: <strong>{puntos} AtlasPuntos</strong>
                        </p>
                    </>
                ) : (
                    <>
                        <div className="exhibit-body">
                            {(stand?.body || []).map((line) => (
                                <p key={line}>{line}</p>
                            ))}
                        </div>
                        <div className="exhibit-rules">
                            <div>
                                <span>♻</span>
                                <strong>+{SCORE.base}</strong>
                                <small>Botella PET</small>
                            </div>
                            <div>
                                <span>◉</span>
                                <strong>+{SCORE.tapa}</strong>
                                <small>Tapa</small>
                            </div>
                            <div>
                                <span>▤</span>
                                <strong>+{SCORE.etiqueta}</strong>
                                <small>Etiqueta</small>
                            </div>
                        </div>
                    </>
                )}

                <button type="button" className="btn primary" onClick={close}>
                    Cerrar
                </button>
            </div>
        </div>
    )
}

/* ---------------------------------------------------------------- */
/* Overlay raíz                                                      */
/* ---------------------------------------------------------------- */

export function Overlay() {
    const phase = useStore((s) => s.phase)
    const hover = useStore((s) => s.hover)
    const [locked, setLocked] = useState(false)

    useEffect(() => {
        const onChange = () => setLocked(document.pointerLockElement !== null)
        document.addEventListener('pointerlockchange', onChange)
        return () => document.removeEventListener('pointerlockchange', onChange)
    }, [])

    useEffect(() => {
        const onKey = (e) => {
            if (e.code !== 'Escape') return
            const st = useStore.getState()
            if (st.phase !== 'panel' || st.scan === 'scanning') return
            st.setPhase('playing')
            lockPointer()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    const closePanel = () => {
        const st = useStore.getState()
        if (st.scan === 'scanning') return
        st.setPhase('playing')
        lockPointer()
    }

    return (
        <div className="overlay">
            {phase === 'menu' && <MainMenu />}

            {phase === 'playing' && locked && (
                <>
                    <div className="crosshair" />
                    <Hud />
                    {hover && (
                        <div className="tooltip">
                            <span className="tooltip-dot" />
                            <span className="tooltip-label">{hover.label}</span>
                            {hover.hint && <span className="tooltip-hint">{hover.hint}</span>}
                        </div>
                    )}
                </>
            )}

            <Toast />
            <Aviso />

            {phase === 'panel' && (
                <>
                    <div className="scrim" onClick={closePanel} />
                    <ScannerPanel onClose={closePanel} />
                </>
            )}

            {phase === 'modal' && (
                <>
                    <div className="scrim" />
                    <ReceiptModal />
                    <InfoModal />
                </>
            )}
        </div>
    )
}