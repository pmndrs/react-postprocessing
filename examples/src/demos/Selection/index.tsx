import * as THREE from 'three'
import React, { useRef, useState, useEffect, useCallback } from 'react'
import { EffectComposer, Outline, SelectiveBloom } from 'react-postprocessing'
import { Canvas, useFrame } from 'react-three-fiber'
import { Sphere, Box } from 'drei'

import produce from 'immer'
import { Mesh } from 'three'

export default function App() {
  return (
    <Canvas>
      <Selection />
    </Canvas>
  )
}

export function Selection() {
  const box1Ref = useRef<typeof Box>()
  const box2Ref = useRef<typeof Box>()

  const [outlineSelection, setOutlineSelection] = useState<React.MutableRefObject<typeof Mesh>[]>([box1Ref, box2Ref])

  const toggleOutline = useCallback((item) => {
    setOutlineSelection(
      produce((draft) => {
        const i = draft.findIndex((obj) => obj.current.uuid === item.current.uuid)

        if (i > -1) {
          draft.splice(i, 1)
        } else {
          draft.push(item)
        }
      })
    )
  }, [])

  const sphere1Ref = useRef<typeof Sphere>()
  const sphere2Ref = useRef<typeof Sphere>()
  const [bloomSelection, setBloomSelection] = useState<React.MutableRefObject<typeof Mesh>[]>([sphere1Ref])

  const toggleBloom = useCallback((item) => {
    setBloomSelection(
      produce((draft) => {
        const i = draft.findIndex((obj) => obj.current.uuid === item.current.uuid)

        if (i > -1) {
          draft.splice(i, 1)
        } else {
          draft.push(item)
        }
      })
    )
  }, [])

  const lightRef = useRef()

  /**
   * Enable the layer you will use for the selective bloom on the lights you want to use
   */
  useEffect(() => {
    lightRef.current.layers.enable(11)
  })

  useFrame(({ clock }) => {
    lightRef.current.position.y = Math.sin(clock.getElapsedTime())
  })

  return (
    <>
      <color attach="background" args={['black']} />
      <fog color={new THREE.Color('#161616')} attach="fog" near={8} far={30} />

      <Box ref={box1Ref} onClick={() => toggleOutline(box1Ref)} position={[1, 1, 1]}>
        <meshNormalMaterial attach="material" />
      </Box>
      <Box ref={box2Ref} onClick={() => toggleOutline(box2Ref)} position={[-1, 1, 0.5]} rotation-z={0.2}>
        <meshNormalMaterial attach="material" />
      </Box>

      <Sphere args={[0.5, 32, 32]} position={[1, -1, 1]} ref={sphere1Ref} onClick={() => toggleBloom(sphere1Ref)}>
        <meshLambertMaterial color="white" />
      </Sphere>

      <Sphere args={[0.5, 32, 32]} position={[-1, -1, 1]} ref={sphere2Ref} onClick={() => toggleBloom(sphere2Ref)}>
        <meshLambertMaterial color="white" />
      </Sphere>

      <EffectComposer>
        <Outline selection={outlineSelection} visibleEdgeColor="blue" edgeStrength={10} pulseSpeed={1} blur={true} />
        <SelectiveBloom selectionLayer={11} selection={bloomSelection} luminanceThreshold={0.1} />
      </EffectComposer>

      <pointLight position={[0, 0, 0]} ref={lightRef} intensity={1} />
    </>
  )
}
