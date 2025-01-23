import { ScanlineEffect, BlendFunction } from 'postprocessing'
import { wrapEffect } from '../util'

export const Scanline = /* @__PURE__ */ wrapEffect(ScanlineEffect, {
  blendFunction: BlendFunction.OVERLAY,
  density: 1.25,
})
