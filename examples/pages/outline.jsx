import React, { useState, Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame } from 'react-three-fiber'
import { EffectComposer, Outline } from '../../dist/esm'
import { BlendFunction } from 'postprocessing'
import { OrbitControls, Sky } from 'drei'

const OutlineDemo = () => {
  const [selection, select] = useState()

  const ref = useRef()

  useEffect(() => {
    console.log(ref)
    ref.current?.selection.set(selection)
  }, [selection])

  return (
    <>
      <h2>outline</h2>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
        }}>
        {JSON.stringify({ selected: typeof selection !== 'undefined' })}
      </div>
      <div className="container">
        <Canvas>
          <OrbitControls />
          <pointLight position={[0, -1, 1]} />
          <ambientLight color="green" />
          <directionalLight color="white" position={[0, 1, 1]} />
          <mesh onClick={(e) => select(e)}>
            <coneGeometry args={[1, 3]} attach="geometry" />
            <meshPhongMaterial color="blue" attach="material" />
          </mesh>
          <Suspense fallback={null}>
            <EffectComposer>
              <Outline ref={ref} />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </div>
    </>
  )
}
export default OutlineDemo
