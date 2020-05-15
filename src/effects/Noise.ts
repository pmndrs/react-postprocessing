import { NoiseEffect } from 'postprocessing'
import { wrapEffect } from '../util'
import { ForwardRefExoticComponent } from 'react'

const Noise: ForwardRefExoticComponent<NoiseEffect> = wrapEffect(NoiseEffect)

export default Noise
