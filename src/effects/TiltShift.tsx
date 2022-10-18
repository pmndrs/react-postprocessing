import { TiltShiftEffect, BlendFunction } from 'postprocessing'
import { wrapEffect } from '../util'

export const TiltShift = wrapEffect(TiltShiftEffect, BlendFunction.ADD)
