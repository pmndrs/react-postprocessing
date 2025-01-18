import { TiltShiftEffect, BlendFunction } from 'postprocessing'
import { wrapEffect } from '../util.tsx'

export const TiltShift = /* @__PURE__ */ wrapEffect(TiltShiftEffect, { blendFunction: BlendFunction.ADD })
