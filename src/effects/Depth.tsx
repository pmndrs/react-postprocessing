import { DepthEffect } from 'postprocessing'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

export const Depth = /* @__PURE__ */ createEffectComponent<typeof DepthEffect, EffectOptions<typeof DepthEffect>>(
  DepthEffect
)
