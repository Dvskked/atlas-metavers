import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { ATLAS } from './atlas/palette'
import { useStore } from './store'
import { Bottles } from './components/Bottles'
import { Carried } from './components/Carried'
import { CopyBrands } from './components/CopyBrands'
import { Interaction } from './components/Interaction'
import { Lights } from './components/Lights'
import { Park } from './components/Park'
import { Player, spawnCamera } from './components/Player'
import { PointerLock } from './components/PointerLock'
import { ScanStation } from './components/ScanStation'
import { Sky } from './components/Sky'

function ResetCamera() {
    const camera = useThree((s) => s.camera)
    const phase = useStore((s) => s.phase)

    useEffect(() => {
        if (phase === 'menu') spawnCamera(camera)
    }, [phase, camera])

    return null
}

export function Experience() {
    return (
        <>
            <color attach="background" args={[ATLAS.bgDeep]} />
            <fog attach="fog" args={[ATLAS.bgDeep, 22, 78]} />

            <Sky />
            <Lights />
            <Park />
            <ScanStation />
            <Bottles />
            <CopyBrands />

            <Interaction />
            <PointerLock />
            <Player />
            <Carried />
            <ResetCamera />
        </>
    )
}