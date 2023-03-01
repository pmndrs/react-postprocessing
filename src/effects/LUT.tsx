import { useThree } from '@react-three/fiber'
import { LUT3DEffect, BlendFunction } from 'postprocessing'
import React, { forwardRef, Ref, useLayoutEffect, useMemo } from 'react'
import { Texture } from 'three'

type LUTProps = {
  lut: Texture
  blendFunction?: BlendFunction
  tetrahedralInterpolation?: boolean
}

export const LUT = forwardRef(function LUT(
  { lut, tetrahedralInterpolation, ...props }: LUTProps,
  ref: Ref<LUT3DEffect>
) {
  const effect = useMemo(() => new LUT3DEffect(lut, props), [lut, props])
  const invalidate = useThree((state) => state.invalidate)

  useLayoutEffect(() => {
    if (tetrahedralInterpolation) effect.tetrahedralInterpolation = tetrahedralInterpolation
    if (lut) effect.lut = lut
    invalidate()
  }, [effect, lut, tetrahedralInterpolation])

  return <primitive ref={ref} object={effect} dispose={null} />
})
