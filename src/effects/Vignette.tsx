import { ForwardRefExoticComponent } from 'react'
import { VignetteEffect } from 'postprocessing'
import { wrapEffect } from '../util'

const Vignette: ForwardRefExoticComponent<VignetteEffect> = wrapEffect(VignetteEffect)

export default Vignette
