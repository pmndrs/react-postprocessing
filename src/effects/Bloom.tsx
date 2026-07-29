import { BlendFunction, BloomEffect } from 'postprocessing'
import { wrapEffect } from '../wrapEffect'

export const Bloom = /* @__PURE__ */ wrapEffect(BloomEffect, {
  blendFunction: BlendFunction.ADD,
})
