import React, { useMemo } from 'react'
import { PixelationEffect } from 'postprocessing'

export type PixelationProps = {
  granularity?: number
}

export const Pixelation = ({ granularity = 5 }: PixelationProps) => {
  /** Because GlitchEffect granularity is not an object but a number, we have to define a custom prop "granularity" */
  const effect = useMemo(() => new PixelationEffect(granularity), [granularity])
  return <primitive object={effect} dispose={null} />
}
