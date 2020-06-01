import { NoiseEffect } from 'postprocessing'
import { wrapEffect } from '../util'
import { ForwardRefExoticComponent } from 'react'

export const Noise: ForwardRefExoticComponent<NoiseEffect> = wrapEffect(NoiseEffect)
