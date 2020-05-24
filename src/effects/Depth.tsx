import { DepthEffect } from 'postprocessing'
import { wrapEffect } from '../util'
import { ForwardRefExoticComponent } from 'react'

const Depth: ForwardRefExoticComponent<DepthEffect> = wrapEffect(DepthEffect)

export default Depth
