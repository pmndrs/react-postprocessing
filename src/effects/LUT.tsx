import { LUT3DEffect, BlendFunction } from 'postprocessing'
import React, { forwardRef, Ref, useMemo } from 'react'
import { Texture } from 'three'

type LUTProps = {
  lut: Texture
  blendFunction?: BlendFunction
  tetrahedralInterpolation?: boolean
}

export const LUT = forwardRef(function LUT({ lut, ...props }: LUTProps, ref: Ref<LUT3DEffect>) {
  const effect = useMemo(() => new LUT3DEffect(lut, props), [lut, props])

  return <primitive ref={ref} object={effect} dispose={null} />
})
