import { Color } from 'three'
import React, { Suspense, useRef } from 'react'
import { Canvas, useFrame } from 'react-three-fiber'
import { EffectComposer, Bloom, SSAO } from 'react-postprocessing'
import { KernelSize } from 'postprocessing'
import Model from './Model'

function Effects() {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      ref.current.luminanceMaterial.threshold = 0.1 + (1 + Math.sin(state.clock.getElapsedTime() * 2)) / 3
    }
  }, [])
  return (
    <EffectComposer>
      <Bloom ref={ref} KernelSize={KernelSize.VERY_LARGE} height={400} opacity={2} />
      <SSAO />
    </EffectComposer>
  )
}

export default function App() {
  return (
    <Canvas
      shadowMap
      colorManagement
      gl={{ alpha: false, logarithmicDepthBuffer: true, precision: 'lowp' }}
      camera={{ position: [0, 2.5, 25], fov: 35 }}
      onCreated={({ gl, scene }) => {
        gl.toneMappingExposure = 1.5
        scene.background = new Color('#272730').convertGammaToLinear()
      }}>
      <fog attach="fog" args={['#272730', 10, 80]} />
      <ambientLight intensity={0.2} />
      <directionalLight castShadow position={[10, 20, 20]} intensity={1} shadow-bias={-0.0005} />
      <directionalLight position={[-10, 5, -20]} angle={2} color="#ffc530" intensity={1} />
      <directionalLight position={[10, 5, -20]} angle={2} color="#ffc530" intensity={2} />
      <pointLight position={[-10, -10, -10]} intensity={5} />
      <Suspense fallback={null}>
        <Model />
        <Effects />
      </Suspense>
    </Canvas>
  )
}
