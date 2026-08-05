import { BrightnessContrastEffect } from 'postprocessing'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

export const BrightnessContrast = /* @__PURE__ */ createEffectComponent<
  typeof BrightnessContrastEffect,
  EffectOptions<typeof BrightnessContrastEffect>
>(BrightnessContrastEffect)
