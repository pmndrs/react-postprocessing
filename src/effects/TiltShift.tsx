import { BlendFunction, TiltShiftEffect } from 'postprocessing'
import type { Ref } from 'react'
import { useMemo } from 'react'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

type TiltShiftOptions = EffectOptions<typeof TiltShiftEffect>

const TiltShiftImpl = /* @__PURE__ */ createEffectComponent<typeof TiltShiftEffect, TiltShiftOptions>(TiltShiftEffect)

export type TiltShiftProps = TiltShiftOptions & {
  opacity?: number
  ref?: Ref<TiltShiftEffect>
}

// kernelSize/resolutionScale/resolutionX/resolutionY have no live setter in
// postprocessing - routed through args so they still work as plain props
// (previously they were passed as plain props and silently never reached
// the effect at all, since there was no setter for diffProps to hit).
export function TiltShift({
  blendFunction = BlendFunction.ADD,
  kernelSize,
  resolutionScale,
  resolutionX,
  resolutionY,
  ...liveProps
}: TiltShiftProps) {
  const args = useMemo<[TiltShiftOptions]>(
    () => [{ kernelSize, resolutionScale, resolutionX, resolutionY }],
    [kernelSize, resolutionScale, resolutionX, resolutionY]
  )
  return <TiltShiftImpl blendFunction={blendFunction} args={args} {...liveProps} />
}
