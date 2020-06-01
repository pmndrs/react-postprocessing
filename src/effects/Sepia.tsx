import { SepiaEffect } from 'postprocessing'
import { wrapEffect } from '../util'
import { ForwardRefExoticComponent } from 'react'

export const Sepia: ForwardRefExoticComponent<SepiaEffect> = wrapEffect(SepiaEffect)
