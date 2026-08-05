import { VignetteEffect } from 'postprocessing'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

export const Vignette = /* @__PURE__ */ createEffectComponent<
  typeof VignetteEffect,
  EffectOptions<typeof VignetteEffect>
>(VignetteEffect)
