import { BlendFunction, BloomEffect } from 'postprocessing'
import type { Ref } from 'react'
import { useMemo } from 'react'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

type BloomOptions = EffectOptions<typeof BloomEffect>

const BloomImpl = /* @__PURE__ */ createEffectComponent<typeof BloomEffect, BloomOptions>(BloomEffect)

export type BloomProps = BloomOptions & { opacity?: number; ref?: Ref<BloomEffect> }

// luminanceThreshold/luminanceSmoothing/mipmapBlur/radius/levels/resolution*
// have no live setter in postprocessing - routed through args so they still
// work as plain props, just via reconstruction instead of mutation.
export function Bloom({
  blendFunction = BlendFunction.ADD,
  luminanceThreshold,
  luminanceSmoothing,
  mipmapBlur,
  radius,
  levels,
  resolutionScale,
  resolutionX,
  resolutionY,
  ...liveProps
}: BloomProps) {
  const args = useMemo<[BloomOptions]>(
    () => [
      { luminanceThreshold, luminanceSmoothing, mipmapBlur, radius, levels, resolutionScale, resolutionX, resolutionY },
    ],
    [luminanceThreshold, luminanceSmoothing, mipmapBlur, radius, levels, resolutionScale, resolutionX, resolutionY]
  )
  return <BloomImpl blendFunction={blendFunction} args={args} {...liveProps} />
}
