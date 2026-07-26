import { PixelationEffect } from 'postprocessing'
import { Ref, useMemo } from 'react'
import { useDispose } from '../util'

export type PixelationProps = {
  granularity?: number
  ref?: Ref<PixelationEffect>
}

export function Pixelation({ granularity = 5, ref }: PixelationProps) {
  /** Because GlitchEffect granularity is not an object but a number, we have to define a custom prop "granularity" */
  const effect = useMemo(() => new PixelationEffect(granularity), [granularity])

  useDispose(effect)

  return <primitive ref={ref} object={effect} />
}
