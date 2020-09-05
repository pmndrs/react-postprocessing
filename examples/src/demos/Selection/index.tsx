import * as THREE from 'three'
import React, { Suspense, useRef, useState, useEffect, useCallback } from 'react'
import { EffectComposer, Outline } from 'react-postprocessing'
import { Canvas } from 'react-three-fiber'
import { Html, Box, Torus } from 'drei'
import { LoadingMsg } from '../../styles'

import produce from 'immer'
import { Mesh } from 'three'

export default function Selection() {
  const box1Ref = useRef<typeof Box>()
  const box2Ref = useRef<typeof Box>()
  const torusRef = useRef<typeof Torus>()

  const [selected, set] = useState<React.MutableRefObject<typeof Mesh>[]>([box1Ref, box2Ref])

  const toggle = useCallback((item) => {
    set(
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

  return (
    <Canvas>
      <color attach="background" args={['black']} />
      <fog color={new THREE.Color('#161616')} attach="fog" near={8} far={30} />
      <Box ref={box1Ref} onClick={() => toggle(box1Ref)} position={[1, 1, 1]}>
        <meshNormalMaterial attach="material" />
      </Box>
      <Box ref={box2Ref} onClick={() => toggle(box2Ref)} position={[-1, 1, 0.5]} rotation-z={0.2}>
        <meshNormalMaterial attach="material" />
      </Box>

      <Torus ref={torusRef} onClick={() => toggle(torusRef)} position={[0, -1, 0.5]} rotation-z={0.2}>
        <meshNormalMaterial attach="material" />
      </Torus>
      <EffectComposer>
        <Outline selection={selected} visibleEdgeColor="blue" edgeStrength={10} pulseSpeed={1} blur={true} />
      </EffectComposer>
    </Canvas>
  )
}
