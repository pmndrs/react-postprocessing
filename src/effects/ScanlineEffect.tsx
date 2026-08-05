import { ScanlineEffect } from 'postprocessing'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

export const Scanline = /* @__PURE__ */ createEffectComponent<
  typeof ScanlineEffect,
  EffectOptions<typeof ScanlineEffect>
>(ScanlineEffect)
