import { BlendFunction, TiltShiftEffect } from 'postprocessing'
import { wrapEffect } from '../wrapEffect'

export const TiltShift = /* @__PURE__ */ wrapEffect(TiltShiftEffect, { blendFunction: BlendFunction.ADD })
