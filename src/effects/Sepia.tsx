import { SepiaEffect } from 'postprocessing'
import { wrapEffect } from '../util'
import { ForwardRefExoticComponent } from 'react'

const Sepia: ForwardRefExoticComponent<SepiaEffect> = wrapEffect(SepiaEffect)

export default Sepia
