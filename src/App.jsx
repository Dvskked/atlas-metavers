import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ATLAS } from './atlas/palette'
import { Experience } from './Experience'
import { Overlay } from './Overlay'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingScreen } from './components/LoadingScreen'

function SceneFallback() {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                background: ATLAS.bgDeep,
                color: ATLAS.white,
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                textAlign: 'center',
                padding: '2rem',
            }}
        >
            <div>
                <h2 style={{ color: ATLAS.cyan, letterSpacing: '0.24em' }}>ATLAS</h2>
                <p>No se pudo iniciar el motor 3D. Revisa que tu navegador tenga WebGL activado.</p>
            </div>
        </div>
    )
}

export default function App() {
    const [ready, setReady] = useState(false)
    const [minElapsed, setMinElapsed] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setMinElapsed(true), 1100)
        return () => clearTimeout(t)
    }, [])

    const loading = !(ready && minElapsed)

    return (
        <>
            <div id="scene">
                <ErrorBoundary fallback={<SceneFallback />}>
                    <Canvas
                        shadows
                        dpr={[1, 2]}
                        onCreated={() => setReady(true)}
                        camera={{ position: [0, 1.65, 13], fov: 72, near: 0.05, far: 200 }}
                    >
                        <Experience />
                    </Canvas>
                </ErrorBoundary>
            </div>
            <Overlay />
            <LoadingScreen visible={loading} />
        </>
    )
}