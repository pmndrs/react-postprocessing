import { ColorAverageEffect, BlendFunction } from 'postprocessing'
import React, { useMemo } from 'react'

export type ColorAverageProps = Partial<{
  blendFunction: number
}>

export const ColorAverage = ({ blendFunction = BlendFunction.NORMAL }: ColorAverageProps) => {
  /** Because ColorAverage blendFunction is not an object but a number, we have to define a custom prop "blendFunction" */
  const effect = useMemo(() => new ColorAverageEffect(blendFunction), [blendFunction])
  return <primitive object={effect} dispose={null} />
}
