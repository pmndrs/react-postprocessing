import React, { Suspense } from 'react'
import { BlendFunction } from 'postprocessing'
import { OrbitControls } from 'drei'
import { Canvas } from 'react-three-fiber'
import { EffectComposer, ColorDepth } from '../../dist/esm'

const ColorDepthDemo = () => (
  <>
    <h2>glitch + noise</h2>
    <div className="container">
      <Canvas>
        <OrbitControls />
        <directionalLight color="white" position={[1, -3, 1]} />
        <directionalLight color="black" position={[1, 2, 1]} />
        <mesh>
          <boxGeometry args={[1, 1, 1]} attach="geometry" />
          <meshPhongMaterial color="red" attach="material" />
        </mesh>
        <Suspense fallback={null}>
          <EffectComposer>
            <ColorDepth bits={16} blendFunction={BlendFunction.ADD} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  </>
)

export default ColorDepthDemo
