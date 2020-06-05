import { ColorAverageEffect } from 'postprocessing'
import { ForwardRefExoticComponent } from 'react'
import { wrapEffect } from '../util'

export const ColorAverage: ForwardRefExoticComponent<ColorAverageEffect> = wrapEffect(ColorAverageEffect)
