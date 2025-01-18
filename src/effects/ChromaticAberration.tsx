import { ChromaticAberrationEffect } from 'postprocessing'
import { type EffectProps, wrapEffect } from '../util'

export type ChromaticAberrationProps = EffectProps<typeof ChromaticAberrationEffect>
export const ChromaticAberration = wrapEffect(ChromaticAberrationEffect)
