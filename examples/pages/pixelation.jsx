import React, { useRef, Suspense } from 'react'
import { Canvas, useLoader, useFrame } from 'react-three-fiber'
import { EffectComposer, Pixelation, SSAO } from '../../dist/esm'
import { OrbitControls } from 'drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import duckUrl from 'url:../public/Duck.glb'

const Duck = () => {
  const ref = useRef()

  useFrame(() => {
    ref.current.rotation.y += 0.01
  })

  const gltf = useLoader(GLTFLoader, duckUrl)

  return <primitive ref={ref} object={gltf.scene} scale={[1.3, 1.3, 1.3]} position={[0, 0, 0]} />
}

const PixelationDemo = () => {
  return (
    <>
      <h2>Pixelation</h2>
      <div className="container">
        <Canvas>
          <OrbitControls />
          <ambientLight />
          <directionalLight position={[0, 1, 2]} color="white" />
          <Suspense fallback={null}>
            <Duck />
            <EffectComposer smaa>
              <SSAO />
              <Pixelation granularity={5} />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </div>
    </>
  )
}

export default PixelationDemo
