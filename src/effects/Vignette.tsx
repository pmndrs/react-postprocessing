import { ForwardRefExoticComponent } from 'react'
import { VignetteEffect } from 'postprocessing'
import { wrapEffect } from '../util'

export const Vignette: ForwardRefExoticComponent<VignetteEffect> = wrapEffect(VignetteEffect)
