import { BlendFunction, ScanlineEffect } from 'postprocessing'
import { wrapEffect } from '../wrapEffect'

export const Scanline = /* @__PURE__ */ wrapEffect(ScanlineEffect, {
  blendFunction: BlendFunction.OVERLAY,
  density: 1.25,
})
