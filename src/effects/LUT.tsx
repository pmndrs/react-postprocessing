import { useThree } from '@react-three/fiber'
import { BlendFunction, LUT3DEffect } from 'postprocessing'
import { Ref, useLayoutEffect, useMemo } from 'react'
import type { Texture } from 'three'
import { useDispose } from '../util'

export type LUTProps = {
  lut: Texture
  blendFunction?: BlendFunction
  tetrahedralInterpolation?: boolean
  ref?: Ref<LUT3DEffect>
}

export function LUT({ lut, tetrahedralInterpolation, ref, ...props }: LUTProps) {
  const effect = useMemo(() => new LUT3DEffect(lut, props), [lut, props])
  const invalidate = useThree((state) => state.invalidate)

  useLayoutEffect(() => {
    if (tetrahedralInterpolation) effect.tetrahedralInterpolation = tetrahedralInterpolation
    if (lut) effect.lut = lut
    invalidate()
  }, [effect, invalidate, lut, tetrahedralInterpolation])

  useDispose(effect)

  return <primitive ref={ref} object={effect} />
}
