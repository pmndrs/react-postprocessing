import { GlitchEffect } from 'postprocessing'
import { wrapEffect } from '../util'
import { ForwardRefExoticComponent } from 'react'

const Glitch: ForwardRefExoticComponent<GlitchEffect> = wrapEffect(GlitchEffect)

export default Glitch
