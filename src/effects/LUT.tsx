import { LUTEffect } from 'postprocessing'
import React, { forwardRef, Ref, useMemo, useLayoutEffect } from 'react'
import { Texture } from 'three'
import { useThree } from '@react-three/fiber'

type LUTProps = ConstructorParameters<typeof LUTEffect>[1] & {
  lut: Texture
}

export const LUT = forwardRef(function LUT({ lut, tetrahedralInterpolation, ...props }: LUTProps, ref: Ref<LUTEffect>) {
  const invalidate = useThree((state) => state.invalidate)
  const effect = useMemo(() => new LUTEffect(lut, props), [lut, props])

  useLayoutEffect(() => {
    if (lut) effect.setLUT(lut)
    if (tetrahedralInterpolation) effect.setTetrahedralInterpolationEnabled(tetrahedralInterpolation)
    invalidate()
  }, [effect, lut, tetrahedralInterpolation])

  return <primitive ref={ref} object={effect} dispose={null} />
})
