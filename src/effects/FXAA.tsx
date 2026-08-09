import { FXAAEffect } from 'postprocessing'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

export const FXAA = /* @__PURE__ */ createEffectComponent<typeof FXAAEffect, EffectOptions<typeof FXAAEffect>>(
  FXAAEffect
)
