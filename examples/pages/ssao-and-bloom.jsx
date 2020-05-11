import React, { useRef, useMemo, Suspense, useEffect } from 'react'
import { Canvas, useFrame } from 'react-three-fiber'
import { EffectComposer, SSAO, Bloom, SMAA } from '../../dist/esm'
import { Color, Object3D, VertexColors } from 'three'
import niceColors from 'nice-color-palettes'
const _object = new Object3D()
const _color = new Color()

function Boxes() {
  const colors = useMemo(() => new Array(1000).fill().map(() => niceColors[17][Math.floor(Math.random() * 5)]), [])
  const colorArray = useMemo(() => {
    // eslint-disable-next-line no-undef
    const color = new Float32Array(1000 * 3)
    for (let i = 0; i < 1000; i++) {
      _color.set(colors[i])
      _color.toArray(color, i * 3)
    }
    return color
  }, [])

  const ref = useRef()
  const attrib = useRef()
  useFrame((state) => {
    //const time = 1 // Easier to debug without movement.
    const time = state.clock.getElapsedTime()
    ref.current.rotation.x = Math.sin(time / 4)
    ref.current.rotation.y = Math.sin(time / 2)
    let i = 0
    for (let x = 0; x < 10; x++)
      for (let y = 0; y < 10; y++)
        for (let z = 0; z < 10; z++) {
          const id = i++
          _object.position.set(5 - x, 5 - y, 5 - z)

          _object.updateMatrix()
          ref.current.setMatrixAt(id, _object.matrix)
        }
    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[null, null, 1000]}>
      <boxBufferGeometry attach="geometry" args={[0.7, 0.7, 0.7]}>
        <instancedBufferAttribute ref={attrib} attachObject={['attributes', 'color']} args={[colorArray, 3]} />
      </boxBufferGeometry>
      <meshPhongMaterial attach="material" vertexColors={VertexColors} />
    </instancedMesh>
  )
}

const SSAOAndBloom = () => {
  const ref = useRef()

  useEffect(() => {
    ref.current?.colorEdgesMaterial.setEdgeDetectionThreshold(0.1)
  }, [])

  return (
    <>
      <h2>SSAO + Bloom</h2>
      <div className="container">
        <Canvas camera={{ position: [0, 0, 15], near: 5, far: 20 }}>
          <Boxes />
          <ambientLight />
          <directionalLight position={[0, 1, 2]} color="white" />
          <EffectComposer>
            <Bloom />
            <SSAO />
            <Suspense fallback={<Boxes />}>
              <SMAA ref={ref} />
            </Suspense>
          </EffectComposer>
        </Canvas>
      </div>
    </>
  )
}

export default SSAOAndBloom
