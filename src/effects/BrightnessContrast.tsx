import { BrightnessContrastEffect } from 'postprocessing'
import { wrapEffect } from '../util'
import { ForwardRefExoticComponent } from 'react'

export const BrightnessContrast: ForwardRefExoticComponent<BrightnessContrastEffect> = wrapEffect(
  BrightnessContrastEffect
)
