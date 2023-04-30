import { BloomEffect, BlendFunction } from 'postprocessing'
import type { BloomEffectOptions } from 'postprocessing'
import { wrapEffect } from '../util'

export const Bloom = wrapEffect<typeof BloomEffect, BloomEffectOptions>(BloomEffect, {
  blendFunction: BlendFunction.ADD,
})
