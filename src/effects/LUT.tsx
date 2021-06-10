import { LUTEffect } from 'postprocessing'
import React, { forwardRef, Ref, useMemo, useLayoutEffect } from 'react'
import { Texture } from 'three'

type LUTProps = ConstructorParameters<typeof LUTEffect>[1] & {
  lut: Texture
}

export const LUT = forwardRef(function LUT({ lut, tetrahedralInterpolation, ...props }: LUTProps, ref: Ref<LUTEffect>) {
  const effect = useMemo(() => new LUTEffect(lut, props), [lut, props])

  useLayoutEffect(() => {
    if (lut) effect.setLUT(lut)
    if (tetrahedralInterpolation) effect.setTetrahedralInterpolationEnabled(tetrahedralInterpolation)
  }, [effect, lut, tetrahedralInterpolation])

  return <primitive ref={ref} object={effect} dispose={null} />
})
