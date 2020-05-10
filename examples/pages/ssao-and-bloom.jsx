import React, { useRef } from 'react'
import { Canvas, useFrame } from 'react-three-fiber'
import { EffectComposer, SSAO, Bloom } from '../../dist/esm'

const Box = () => {
  const ref = useRef()

  useFrame(() => {
    ref.current.rotateX(0.01)
    ref.current.rotateY(0.01)
    ref.current.rotateZ(-0.01)
  })

  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} attach="geometry" />
      <meshPhongMaterial color="grey" attach="material" />
    </mesh>
  )
}

console.log(Bloom)

const SSAOAndBloom = () => (
  <>
    <h2>SSAO + Bloom</h2>
    <div className="container">
      <Canvas>
        <Box />
        <ambientLight />
        <directionalLight position={[0, 1, 1]} color="white" />
        <EffectComposer>
          <Bloom />
        </EffectComposer>
      </Canvas>
    </div>
  </>
)

export default SSAOAndBloom
