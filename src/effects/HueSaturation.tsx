import { HueSaturationEffect } from 'postprocessing'
import { ForwardRefExoticComponent } from 'react'
import { wrapEffect } from '../util'

export const HueSaturation: ForwardRefExoticComponent<HueSaturationEffect> = wrapEffect(HueSaturationEffect)
