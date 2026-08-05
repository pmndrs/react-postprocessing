import { ColorAverageEffect } from 'postprocessing'
import { createEffectComponent } from '../createEffectComponent'

export const ColorAverage = /* @__PURE__ */ createEffectComponent<typeof ColorAverageEffect, object>(ColorAverageEffect)
