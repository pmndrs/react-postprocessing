import { DepthEffect } from 'postprocessing'
import { wrapEffect } from '../util'
import { ForwardRefExoticComponent } from 'react'

export const Depth: ForwardRefExoticComponent<DepthEffect> = wrapEffect(DepthEffect)
