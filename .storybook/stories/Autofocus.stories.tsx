import React from 'react'
import * as THREE from 'three'
import type { Meta, StoryObj } from '@storybook/react'
import { Setup } from '../Setup'

import { EffectComposer } from '../../src'

import { Autofocus } from '../../src'

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta = {
  title: 'Effect/Autofocus',
  component: Autofocus,
  decorators: [(Story) => <Setup cameraPosition={new THREE.Vector3(1, 1, 2)}>{Story()}</Setup>],
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
      <mesh castShadow>
        <sphereGeometry args={[0.5, 64, 64]} />
        <meshStandardMaterial color="#9d4b4b" />
      </mesh>
      <mesh castShadow position={[1, 0, -3]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#9d4b4b" />
      </mesh>

      <gridHelper />

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
