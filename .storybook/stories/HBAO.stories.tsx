import * as React from 'react'
import * as THREE from 'three'
import type { Meta, StoryObj } from '@storybook/react'
import { EffectComposer, HBAO as HBAOImpl } from '../../src'
import { Canvas } from '@react-three/fiber'
import { Environment, useGLTF, OrbitControls } from '@react-three/drei'

const meta = {
  title: 'Effects/HBAO',
  component: HBAOImpl,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof HBAOImpl>
export default meta

function Model() {
  const gltf = useGLTF('/porsche.glb')
  return <primitive object={gltf.scene} />
}

type Story = StoryObj<typeof meta>

export const HBAO: Story = {
  render: (args) => (
    <Canvas gl={{ antialias: false }} camera={{ fov: 35, position: [5, 3, 5] }}>
      <OrbitControls />
      <Environment preset="city" />
      <EffectComposer disableNormalPass multisampling={0}>
        <HBAOImpl {...args} />
      </EffectComposer>
      <Model />
      <directionalLight position={[217, 43, 76]} />
    </Canvas>
  ),
  args: {
    // AO
    resolutionScale: 1,
    spp: 8,
    distance: 2,
    distancePower: 1,
    power: 2,
    bias: 40,
    thickness: 0.075,
    color: new THREE.Color('black'),
    useNormalPass: false,
    // Poisson
    iterations: 1,
    radius: 8,
    rings: 5.625,
    lumaPhi: 10,
    depthPhi: 2,
    normalPhi: 3.25,
    samples: 16,
  },
}
