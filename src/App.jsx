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
    const [mounted, setMounted] = useState(false)
    const [webglOk, setWebglOk] = useState(true)

    useEffect(() => {
        setMounted(true)
        try {
            const canvas = document.createElement('canvas')
            const gl =
                canvas.getContext('webgl2') ||
                canvas.getContext('webgl') ||
                canvas.getContext('experimental-webgl')
            if (!gl) setWebglOk(false)
        } catch (e) {
            setWebglOk(false)
        }
        const t = setTimeout(() => setMinElapsed(true), 1100)
        return () => clearTimeout(t)
    }, [])

    const loading = !(ready && minElapsed)

    if (!mounted || !webglOk) {
        return <SceneFallback />
    }

    return (
        <>
            <div id="scene">
                <ErrorBoundary fallback={<SceneFallback />}>
                    <Canvas
                        shadows
                        dpr={[1, 2]}
                        onCreated={({ gl }) => {
                            try {
                                if (!gl || !gl.getContext()) {
                                    setWebglOk(false)
                                }
                            } catch {}
                            setReady(true)
                        }}
                        gl={{
                            antialias: true,
                            alpha: true,
                            powerPreference: 'high-performance',
                            preserveDrawingBuffer: false,
                        }}
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