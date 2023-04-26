import { NoiseEffect, BlendFunction } from 'postprocessing'
import { wrapEffect } from '../util'

export const Noise = wrapEffect(NoiseEffect, { blendFunction: BlendFunction.COLOR_DODGE })
