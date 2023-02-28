import { LUT1DEffect, BlendFunction } from 'postprocessing'
import React, { forwardRef, Ref, useMemo } from 'react'
import { Texture } from 'three'

type LUTProps = {
  lut: Texture
  blendFunction: BlendFunction
}

export const LUT = forwardRef(function LUT({ lut, ...props }: LUTProps, ref: Ref<LUT1DEffect>) {
  const effect = useMemo(() => new LUT1DEffect(lut, props), [lut, props])

  return <primitive ref={ref} object={effect} dispose={null} />
})
