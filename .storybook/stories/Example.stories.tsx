import React, { memo } from 'react'
import * as THREE from 'three'
import type { Meta, StoryObj } from '@storybook/react'
import { Box, useTexture } from '@react-three/drei'

import { Setup } from '../Setup'
import { EffectComposer, Example } from '../../src'
import { BlendFunction } from 'postprocessing'

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta = {
  title: 'Effect/Example',
  component: Example,
  decorators: [(Story) => <Setup>{Story()}</Setup>],
  tags: ['autodocs'],
  argTypes: {
    blendFunction: {
      control: 'select',
      options: Object.keys(BlendFunction),
      mapping: Object.keys(BlendFunction).reduce((acc, k) => {
        acc[k] = BlendFunction[k]
        return acc
      }, {}),
    },
    opacity: { control: { type: 'range', min: 0, max: 1, step: 0.001 } },
    color: { control: { type: 'color' } },
  },
} satisfies Meta<typeof Example>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Primary: Story = {
  render: ({ color, ...args }) => (
    <>
      <Box />

      <EffectComposer>
        <Example color={color && new THREE.Color(color)} {...args} />
      </EffectComposer>
    </>
  ),
  args: {
    blendFunction: BlendFunction.ADD,
    color: 'red' as unknown as THREE.Color,
  },
}
