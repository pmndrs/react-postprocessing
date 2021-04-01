import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, Stats } from '@react-three/drei'
import Effects from './Effects'
import Scene from './Scene'
import { ControlsContainer } from './styles'
import { LoadingMsg } from '../../styles'

function TakeControl() {
  const showControls = window.location.search.includes('ctrl')

  return (
    <>
      <Canvas
        shadows
        linear={true}
        dpr={1.5}
        camera={{ position: [0, 0, 3], far: 1000, fov: 70 }}
        gl={{
          powerPreference: 'high-performance',
          alpha: false,
          antialias: false,
          stencil: false,
          depth: false,
        }}
      >
        {showControls && <Stats />}

        <Effects />
        <Suspense
          fallback={
            <Html center>
              <LoadingMsg>Loading...</LoadingMsg>
            </Html>
          }
        >
          <Scene />
        </Suspense>
      </Canvas>
    </>
  )
}

export default TakeControl
