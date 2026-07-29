import { ChromaticAberrationEffect } from 'postprocessing'
import { type EffectProps, wrapEffect } from '../wrapEffect'

export type ChromaticAberrationProps = EffectProps<typeof ChromaticAberrationEffect>
export const ChromaticAberration = /* @__PURE__ */ wrapEffect(ChromaticAberrationEffect)
