import { DotScreenEffect } from 'postprocessing'
import { ForwardRefExoticComponent } from 'react'
import { wrapEffect } from '../util'

export const DotScreen: ForwardRefExoticComponent<DotScreenEffect> = wrapEffect(DotScreenEffect)
