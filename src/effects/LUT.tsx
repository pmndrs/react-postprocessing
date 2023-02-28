import { LUT1DEffect, BlendFunction } from 'postprocessing'
import React, { forwardRef, Ref, useMemo, useLayoutEffect } from 'react'
import { Texture } from 'three'
import { useThree } from '@react-three/fiber'

type LUTProps = {
  lut: Texture
  blendFunction: BlendFunction
}

export const LUT = forwardRef(function LUT({ lut, ...props }: LUTProps, ref: Ref<LUT1DEffect>) {
  const { invalidate } = useThree((state) => state.invalidate)
  const effect = useMemo(() => new LUT1DEffect(lut, props), [lut, props])

  return <primitive ref={ref} object={effect} dispose={null} />
})
