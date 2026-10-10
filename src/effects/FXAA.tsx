import { FXAAEffect } from 'postprocessing'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

// Not constructor options, but live setters on FXAAEffect
export type FXAAProps = EffectOptions<typeof FXAAEffect> & {
  minEdgeThreshold?: number
  maxEdgeThreshold?: number
  subpixelQuality?: number
  samples?: number
}

export const FXAA = /* @__PURE__ */ createEffectComponent<typeof FXAAEffect, FXAAProps>(FXAAEffect)
