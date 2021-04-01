import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Effects, Html, Stats } from '@react-three/drei'
import Scene from './Scene'

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
        <Suspense fallback={<Html center>Loading...</Html>}>
          <Scene />
        </Suspense>
      </Canvas>
    </>
  )
}

export default {
  component: TakeControl,
  description: 'Noise, Vignette, HueSaturation, GodRays',
  name: 'Take Control',
  path: '/take-control',
}
