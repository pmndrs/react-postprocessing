import { NoiseEffect, BlendFunction } from 'postprocessing'
import { wrapEffect } from '../util.tsx'

export const Noise = /* @__PURE__ */ wrapEffect(NoiseEffect, { blendFunction: BlendFunction.COLOR_DODGE })
