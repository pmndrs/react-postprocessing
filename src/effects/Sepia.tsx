import { SepiaEffect } from 'postprocessing'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

export const Sepia = /* @__PURE__ */ createEffectComponent<typeof SepiaEffect, EffectOptions<typeof SepiaEffect>>(
  SepiaEffect
)
