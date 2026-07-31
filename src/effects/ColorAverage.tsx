import { BlendFunction, ColorAverageEffect } from 'postprocessing'
import type { Ref } from 'react'
import { useMemo } from 'react'
import { useDispose } from '../util'

export type ColorAverageProps = {
  blendFunction?: BlendFunction
  ref?: Ref<ColorAverageEffect>
}

export function ColorAverage({ blendFunction = BlendFunction.NORMAL, ref }: ColorAverageProps) {
  const effect = useMemo(() => new ColorAverageEffect(blendFunction), [blendFunction])

  useDispose(effect)

  return <primitive object={effect} ref={ref} />
}
