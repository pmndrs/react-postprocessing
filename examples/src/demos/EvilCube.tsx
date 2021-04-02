import React from 'react'
import { EffectComposer, Vignette, Noise, Glitch } from '@react-three/postprocessing'
import { Canvas, useThree } from '@react-three/fiber'
import { Box, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Vector3 } from 'three'

const Scene = () => {
  return (
    <>
      <OrbitControls />
      <Box rotation={[0, 1, 2]}>
        <meshBasicMaterial attach="material" color="red" />
      </Box>
      <ambientLight intensity={0.3} />

      <EffectComposer multisampling={0}>
        <Glitch delay={[1, 2]} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
        <Noise />
      </EffectComposer>
    </>
  )
}

const EvilCube = () => {
  return (
    <Canvas
      onCreated={({ scene }) => {
        scene.background = new THREE.Color('red')
      }}
    >
      <Scene />
    </Canvas>
  )
}

export default {
  component: EvilCube,
  description: 'Glitch + Vignette + Noise',
  name: 'Evil Cube',
  path: '/evil-cube',
}
