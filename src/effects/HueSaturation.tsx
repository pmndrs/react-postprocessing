import { HueSaturationEffect } from 'postprocessing'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

export const HueSaturation = /* @__PURE__ */ createEffectComponent<
  typeof HueSaturationEffect,
  EffectOptions<typeof HueSaturationEffect>
>(HueSaturationEffect)
