import { ATLAS } from '../atlas/palette'

/**
 * Iluminación del parque: luna fría + relleno hemisférico + rebote cyan.
 * Se reparte en varios ficheros para no saturar de luces el renderer.
 */
export function Lights() {
    return (
        <>
            <ambientLight intensity={0.42} color="#24406a" />
            <hemisphereLight args={['#1e3f70', '#04080f', 0.6]} />
            <directionalLight
                position={[-14, 22, 10]}
                intensity={0.75}
                color="#a8c8ff"
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-left={-22}
                shadow-camera-right={22}
                shadow-camera-top={22}
                shadow-camera-bottom={-22}
                shadow-bias={-0.0002}
            />
            {/* rebote cyan desde la estación, para que el destino destaque */}
            <pointLight position={[0, 2.2, -8]} intensity={40} distance={16} decay={2} color={ATLAS.cyan} />
            <pointLight
                position={[0, 1.4, 4]}
                intensity={16}
                distance={14}
                decay={2}
                color={ATLAS.blue}
            />
        </>
    )
}