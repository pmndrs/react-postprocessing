import type { ReactThreeFiber } from '@react-three/fiber'
import { LensDistortionEffect } from 'postprocessing'
import type { Ref } from 'react'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

// postprocessing's .d.ts types distortion/principalPoint/focalLength as
// required, but the constructor defaults all of them.
export type LensDistortionProps = Omit<
  EffectOptions<typeof LensDistortionEffect>,
  'distortion' | 'principalPoint' | 'focalLength'
> & {
  distortion?: ReactThreeFiber.Vector2
  principalPoint?: ReactThreeFiber.Vector2
  focalLength?: ReactThreeFiber.Vector2
  ref?: Ref<LensDistortionEffect>
}

export const LensDistortion = /* @__PURE__ */ createEffectComponent<typeof LensDistortionEffect, LensDistortionProps>(
  LensDistortionEffect
)
