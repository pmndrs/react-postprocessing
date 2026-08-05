import { BlendFunction, NoiseEffect } from 'postprocessing'
import type { Ref } from 'react'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

const NoiseImpl = /* @__PURE__ */ createEffectComponent<typeof NoiseEffect, EffectOptions<typeof NoiseEffect>>(
  NoiseEffect
)

export type NoiseProps = EffectOptions<typeof NoiseEffect> & {
  opacity?: number
  ref?: Ref<NoiseEffect>
}

export function Noise({ blendFunction = BlendFunction.COLOR_DODGE, ...props }: NoiseProps) {
  return <NoiseImpl blendFunction={blendFunction} {...props} />
}
