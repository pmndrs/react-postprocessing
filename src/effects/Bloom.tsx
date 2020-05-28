import { ForwardRefExoticComponent } from 'react'
import { BloomEffect } from 'postprocessing'
import { wrapEffect } from '../util'

const Bloom: ForwardRefExoticComponent<BloomEffect> = wrapEffect(BloomEffect)

export default Bloom
