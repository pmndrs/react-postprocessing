import * as THREE from 'three'
import React, { Suspense, useRef, useState, useEffect } from 'react'
import { EffectComposer, Outline } from 'react-postprocessing'
import { Canvas } from 'react-three-fiber'
import { Html, Box } from 'drei'
import { LoadingMsg } from '../../styles'

export default function Selection() {
  const box1Ref = useRef<typeof Box>()

  const box2Ref = useRef<typeof Box>()

  const [selected, set] = useState<React.MutableRefObject<typeof Box>[]>([box1Ref, undefined])

  useEffect(() => void console.log(`Selected: ${selected.map((x) => Boolean(x))}`), [selected])

  return (
    <Canvas>
      <color attach="background" args={['black']} />
      <fog color={new THREE.Color('#161616')} attach="fog" near={8} far={30} />
      <Suspense
        fallback={
          <Html center>
            <LoadingMsg>Loading...</LoadingMsg>
          </Html>
        }
      >
        <Box
          ref={box1Ref}
          onClick={() => set(selected[0] ? [undefined, selected[1]] : [box1Ref, selected[1]])}
          position={[1, 1, 1]}
        >
          <meshNormalMaterial attach="material" />
        </Box>
        <Box
          ref={box2Ref}
          onClick={() => set(selected[1] ? [selected[0], undefined] : [selected[0], box2Ref])}
          position={[-1, 1, 0.5]}
          rotation-z={0.2}
        >
          <meshNormalMaterial attach="material" />
        </Box>
      </Suspense>
      <EffectComposer>
        <Outline selection={selected.filter((x) => typeof x !== 'undefined')} />
      </EffectComposer>
    </Canvas>
  )
}
