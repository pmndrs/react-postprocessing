import { DotScreenEffect } from 'postprocessing'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

export const DotScreen = /* @__PURE__ */ createEffectComponent<
  typeof DotScreenEffect,
  EffectOptions<typeof DotScreenEffect>
>(DotScreenEffect)
