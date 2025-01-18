import { BloomEffect, BlendFunction } from 'postprocessing'
import { wrapEffect } from '../util.tsx'

export const Bloom = /* @__PURE__ */ wrapEffect(BloomEffect, {
  blendFunction: BlendFunction.ADD,
  args: [],
})
