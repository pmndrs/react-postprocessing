import { TiltShiftEffect, BlendFunction } from 'postprocessing'
import { wrapEffect } from '../util'

export const TiltShift = /* @__PURE__ */ wrapEffect(TiltShiftEffect, { blendFunction: BlendFunction.ADD })
