import React, { useRef, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from 'react-three-fiber'
import { EffectComposer, SMAA, Bloom } from '../../dist/esm'

const Box = () => {
  const ref = useRef()

  useFrame(() => {
    ref.current.rotateX(0.01)
    ref.current.rotateY(Math.random() * 0.01)
    ref.current.rotateZ(0.01)
  })

  return (
    <mesh ref={ref}>
      <boxGeometry args={[3, 3, 3]} attach="geometry" />
      <meshBasicMaterial color="black" attach="material" />
    </mesh>
  )
}

const SMAAAndBloom = () => {
  const ref = useRef()

  useEffect(() => {
    ref.current?.colorEdgesMaterial.setEdgeDetectionThreshold(0.8)
  }, [])

  return (
    <>
      <h2>SSAO + Bloom</h2>
      <div className="container">
        <Canvas>
          <Box />
          <ambientLight />
          <directionalLight position={[0, 1, 2]} color="white" />
          <EffectComposer>
            <Bloom />
            <Suspense fallback={<></>}>
              <SMAA ref={ref} />
            </Suspense>
          </EffectComposer>
        </Canvas>
      </div>
    </>
  )
}

export default SMAAAndBloom
