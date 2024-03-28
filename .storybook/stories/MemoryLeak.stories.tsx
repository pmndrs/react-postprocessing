import { Box, Stats, useTexture } from '@react-three/drei'
import type { Meta, StoryObj } from '@storybook/react'
import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { BackSide } from 'three'

import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, LensFlare } from '../../src'
import { Setup } from '../Setup'

const meta = {
  title: 'MemoryLeak',
  component: LensFlare,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new THREE.Vector3(8, 1, 10)} cameraFov={50}>
        <Stats showPanel={2} />
        {Story()}
      </Setup>
    ),
  ],
} satisfies Meta<typeof LensFlare>

export default meta
type Story = StoryObj<typeof meta>

export const WithPostprocessing: Story = {
  render: (args) => (
    <>
      <color attach="background" args={['#303035']} />

      <CameraSwitcher />

      <directionalLight intensity={3} position={[-25, 60, -60]} />

      <Box />

      <SkyBox />

      <EffectComposer multisampling={0}>
        <LensFlare {...args} />
      </EffectComposer>
    </>
  ),
  args: {},
}

export const WithoutPostprocessing: Story = {
  render: (args) => (
    <>
      <color attach="background" args={['#303035']} />

      <CameraSwitcher />

      <directionalLight intensity={3} position={[-25, 60, -60]} />

      <Box />

      <SkyBox />
    </>
  ),
  args: {},
}

function CameraSwitcher() {
  const { camera, set } = useThree()
  const camRef = useRef(new THREE.OrthographicCamera())
  const camDef = useRef(camera)

  const keySPressedCount = useKeyPressedCount('c')

  const switchCamera = () => {
    const newcam = camera === camDef.current ? camRef.current : camDef.current
    set(() => ({ camera: newcam }))

    // log memory usage
    // if ('memory' in performance) {
    //   console.log(((performance as any).memory.usedJSHeapSize / 1024 / 1024).toFixed(0))
    // }
  }

  useFrame(() => {
    if (keySPressedCount % 2 === 1) {
      switchCamera()
    }
  })

  return null
}

function useKeyPressedCount(key: string) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === key) {
        setCount((prev) => prev + 1)
      }
    }

    window.addEventListener('keydown', handler)

    return () => window.removeEventListener('keydown', handler)
  }, [])

  return count
}

function SkyBox() {
  const texture = useTexture('digital_painting_golden_hour_sunset.jpg')

  return (
    <mesh userData={{ lensflare: 'no-occlusion' }} scale={[-1, 1, 1]} castShadow={false} receiveShadow={false}>
      <sphereGeometry args={[50, 32, 32]} />
      <meshBasicMaterial toneMapped={false} map={texture} side={BackSide} />
    </mesh>
  )
}
