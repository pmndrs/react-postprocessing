import React, { useRef, Suspense } from 'react'
import { Canvas, useFrame } from 'react-three-fiber'
import { EffectComposer, Glitch, Noise } from '../../dist/esm'
import { BlendFunction } from 'postprocessing'
import { OrbitControls } from 'drei'

// eslint-disable-next-line react/prop-types
export const Box = ({ size, ...props } = { size: 3 }) => {
  const ref = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    ref.current.rotation.x = Math.sin(time / 4)
    ref.current.rotation.y = Math.sin(time / 2)
  })

  return (
    <mesh ref={ref} {...props}>
      <boxGeometry args={[size, size, size]} attach="geometry" />
      <meshBasicMaterial color="red" attach="material" />
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
        <Suspense fallback={null}>
          <EffectComposer>
            <Glitch />
            <Noise blendFunction={BlendFunction.DIVIDE} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  </>
)

export default GlitchAndNoise
