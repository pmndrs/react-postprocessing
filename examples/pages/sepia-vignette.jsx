import React, { Suspense } from 'react'
import { Canvas } from 'react-three-fiber'
import { EffectComposer, Vignette, Sepia } from '../../dist/esm'
import { OrbitControls, Sky } from 'drei'
import { Box } from './glitch-and-noise'

const SepiaVignette = () => {
  return (
    <>
      <h2>Vignette and Sepia</h2>
      <div className="container">
        <Canvas>
          <OrbitControls />
          <pointLight position={[2, 1, 2]} color="yellow" />
          <Box size={3} position={[0, 0, 0]} />
          <Sky />
          <Suspense fallback={null}>
            <EffectComposer>
              <Sepia />
              <Vignette darkness={1} offset={0.1} />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </div>
    </>
  )
}

export default SepiaVignette
