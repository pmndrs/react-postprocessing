import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { EffectComposer, SSGI as SSGIImpl, TRAA } from '../../src'
import { Canvas } from '@react-three/fiber'
import { Environment, useGLTF, OrbitControls } from '@react-three/drei'

const meta = {
  title: 'Effects/SSGI',
  component: SSGIImpl,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SSGIImpl>
export default meta

function Model() {
  const gltf = useGLTF('/porsche.glb')
  return <primitive object={gltf.scene} />
}

type Story = StoryObj<typeof meta>

export const SSGI: Story = {
  render: (args) => (
    <Canvas gl={{ antialias: false }} camera={{ fov: 35, position: [5, 3, 5] }}>
      <OrbitControls />
      <Environment preset="city" />
      <EffectComposer>
        <SSGIImpl {...args} />
        <TRAA />
      </EffectComposer>
      <Model />
      <directionalLight position={[217, 43, 76]} />
    </Canvas>
  ),
  args: {
    distance: 10,
    thickness: 10,
    autoThickness: false,
    maxRoughness: 1,
    blend: 0.9,
    denoiseIterations: 1,
    denoiseKernel: 2,
    denoiseDiffuse: 10,
    denoiseSpecular: 10,
    depthPhi: 2,
    normalPhi: 50,
    roughnessPhi: 1,
    envBlur: 0.5,
    importanceSampling: true,
    directLightMultiplier: 1,
    steps: 20,
    refineSteps: 5,
    spp: 1,
    resolutionScale: 1,
    missedRays: false,
  },
}
