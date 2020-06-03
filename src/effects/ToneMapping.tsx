import { ForwardRefExoticComponent } from 'react'
import { ToneMappingEffect } from 'postprocessing'
import { wrapEffect } from '../util'

export const ToneMapping: ForwardRefExoticComponent<ToneMappingEffect> = wrapEffect(ToneMappingEffect)
