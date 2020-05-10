import React, { useRef } from 'react'
import { Canvas, useFrame, extend } from 'react-three-fiber'
import { EffectComposer, Glitch, Noise } from '../../dist/esm'
import { BlendFunction } from 'postprocessing'

const Box = () => {
  const ref = useRef()

  useFrame(() => {
    ref.current.rotateX(0.01)
    ref.current.rotateY(0.01)
    ref.current.rotateZ(-0.01)
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
        <Box />
        <EffectComposer>
          <Glitch />
          <Noise blendFunction={BlendFunction.DIVIDE} />
        </EffectComposer>
      </Canvas>
    </div>
  </>
)

export default GlitchAndNoise
