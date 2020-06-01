import { ColorDepthEffect } from 'postprocessing'
import { wrapEffect } from '../util'
import { ForwardRefExoticComponent } from 'react'

export const ColorDepth: ForwardRefExoticComponent<ColorDepthEffect> = wrapEffect(ColorDepthEffect)
