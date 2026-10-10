import { BlendFunction, LUT3DEffect } from 'postprocessing'
import { Ref, useMemo } from 'react'
import type { Texture } from 'three'
import { useDispose, useLiveDefaults } from '../util'

export type LUTProps = {
  lut: Texture
  blendFunction?: BlendFunction
  tetrahedralInterpolation?: boolean
  opacity?: number
  ref?: Ref<LUT3DEffect>
}

const LIVE_KEYS = ['blendMode-blendFunction', 'blendMode-opacity-value', 'lut', 'tetrahedralInterpolation']

// lut is LUT3DEffect's required constructor arg (no default) - only used
// for the initial instance, later changes go through its own live setter
// (via useLiveDefaults below) instead of reconstructing.
export function LUT({ lut, blendFunction, opacity, tetrahedralInterpolation, ref }: LUTProps) {
  const effect = useMemo(() => new LUT3DEffect(lut), [])

  useLiveDefaults(
    effect,
    { 'blendMode-blendFunction': blendFunction, 'blendMode-opacity-value': opacity, lut, tetrahedralInterpolation },
    LIVE_KEYS
  )
  useDispose(effect)

  return <primitive ref={ref} object={effect} />
}
