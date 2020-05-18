import React, { useState, Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from 'react-three-fiber'
import { EffectComposer, Outline } from '../../dist/esm'
import { BlendFunction } from 'postprocessing'
import { OrbitControls } from 'drei'

const OutlineDemo = () => {
  const [selected, select] = useState(false)

  const outlineRef = useRef()

  const meshRef = useRef()

  const { gl } = useThree()

  useEffect(() => {
    if (meshRef.current && outlineRef.current) {
      const outlineSelection = outlineRef.current.selection

      const mesh = meshRef.current

      if (selected) {
        outlineRef.current.clearSelection()
        outlineRef.current.update(gl /* inputBuffer: WebGLRenderTarget, deltaTime: Number */)
      } else {
        outlineSelection.set([mesh])
      }
    }
  }, [selected])

  return (
    <>
      <h2>outline</h2>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
        }}>
        {JSON.stringify({ selected })}
      </div>
      <div className="container">
        <Canvas
          gl={{
            alpha: true,
          }}>
          <OrbitControls />
          <pointLight position={[0, -1, 1]} />
          <ambientLight color="green" />
          <directionalLight color="white" position={[0, 1, 1]} />
          <mesh ref={meshRef} onClick={() => select(!selected)}>
            <coneGeometry args={[1, 3]} attach="geometry" />
            <meshPhongMaterial color="blue" attach="material" />
          </mesh>
          <Suspense fallback={null}>
            <EffectComposer>
              <Outline
                xRay
                edgeStrength={2.5}
                pulseSpeed={0.0}
                visibleEdgeColor={0xffffff}
                hiddenEdgeColor={0x22090a}
                ref={outlineRef}
              />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </div>
    </>
  )
}
export default OutlineDemo
