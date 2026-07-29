import { BlendFunction, NoiseEffect } from 'postprocessing'
import { wrapEffect } from '../wrapEffect'

export const Noise = /* @__PURE__ */ wrapEffect(NoiseEffect, { blendFunction: BlendFunction.COLOR_DODGE })
