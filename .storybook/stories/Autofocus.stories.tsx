import React, { memo } from 'react'
import * as THREE from 'three'
import type { Meta, StoryObj } from '@storybook/react'
import { useGLTF, Center, Resize, AccumulativeShadows, RandomizedLight, Environment, Stats } from '@react-three/drei'

import { Setup } from '../Setup'
import { EffectComposer, Autofocus } from '../../src'

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta = {
  title: 'Effect/Autofocus',
  component: Autofocus,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new THREE.Vector3(-17, 1.5, 13)} cameraFov={20} lights={false}>
        {Story()}
      </Setup>
    ),
  ],
  tags: ['autodocs'],
  // argTypes: {
  //   debug: {
  //     control: { type: 'range', min: 0, max: 1, step: 0.01 },
  //   },
  // },
} satisfies Meta<typeof Autofocus>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Primary: Story = {
  render: (args) => (
    <>
      <color attach="background" args={['#303035']} />

      <group position-y={-0.5} position-x={-1}>
        <Center top>
          <Resize scale={3.5}>
            <Suzi rotation={[-0.63, 0, 0]}>
              <meshStandardMaterial color="#9d4b4b" />
            </Suzi>
          </Resize>
        </Center>
        <Center top position={[-2, 0, 2]}>
          <mesh castShadow>
            <sphereGeometry args={[0.5, 64, 64]} />
            <meshStandardMaterial color="#9d4b4b" />
          </mesh>
        </Center>
        <Center top position={[2.5, 0, 1]}>
          <mesh castShadow rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[0.7, 0.7, 0.7]} />
            <meshStandardMaterial color="#9d4b4b" />
          </mesh>
        </Center>

        <Shadows />
        <Environment preset="city" />
        <Stats />
      </group>

      <EffectComposer>
        <Autofocus {...args} />
      </EffectComposer>
    </>
  ),
  args: {
    mouse: true,
    debug: 0.04,
    bokehScale: 8,
    focusRange: 0.001,
  },
}

const Suzi = ({ children, ...props }) => {
  console.log(import.meta.url)
  const { nodes } = useGLTF('/suzi.gltf') as any
  return (
    <>
      <mesh castShadow receiveShadow geometry={nodes.Suzanne.geometry} {...props}>
        {children}
      </mesh>
    </>
  )
}

const Shadows = memo(() => (
  <AccumulativeShadows temporal frames={100} color="#9d4b4b" colorBlend={0.5} alphaTest={0.9} scale={20}>
    <RandomizedLight amount={8} radius={4} position={[5, 5, -10]} />
  </AccumulativeShadows>
))
