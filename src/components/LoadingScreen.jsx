import { ATLAS } from '../atlas/palette'

export function LoadingScreen({ visible }) {
    return (
        <div className={`loading-screen${visible ? '' : ' done'}`}>
            <div className="loading-body">
                <img className="loading-logo" src={`${import.meta.env.BASE_URL}logo-atlas.png`} alt="Atlas" />
                <h1 className="loading-title">ATLAS</h1>
                <p className="loading-sub">Red inteligente de reciclaje</p>
                <div className="loading-spinner" />
                <span className="loading-badge">Cargando el parque…</span>
            </div>
            <div className="loading-fade" style={{ background: ATLAS.bgDeep }} />
        </div>
    )
}