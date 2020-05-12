import React, { useRef } from 'react'
import { Canvas, useFrame } from 'react-three-fiber'
import { EffectComposer, Glitch, Noise } from '../../dist/esm'
import { BlendFunction } from 'postprocessing'
import { OrbitControls } from 'drei'

export const Box = () => {
  const ref = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    ref.current.rotation.x = Math.sin(time / 4)
    ref.current.rotation.y = Math.sin(time / 2)
  })

  return (
    <mesh ref={ref}>
      <boxGeometry args={[3, 3, 3]} attach="geometry" />
      <meshBasicMaterial color="red" wireframe attach="material" />
    </mesh>
  )
}

const GlitchAndNoise = () => (
  <>
    <h2>glitch + noise</h2>
    <div className="container">
      <Canvas>
        <OrbitControls />
        <Box />
        <EffectComposer smaa={false}>
          <Glitch />
          <Noise blendFunction={BlendFunction.DIVIDE} />
        </EffectComposer>
      </Canvas>
    </div>
  </>
)

export default GlitchAndNoise
