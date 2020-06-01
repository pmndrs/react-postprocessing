import { ForwardRefExoticComponent } from 'react'
import { BloomEffect } from 'postprocessing'
import { wrapEffect } from '../util'

export const Bloom: ForwardRefExoticComponent<BloomEffect> = wrapEffect(BloomEffect)
