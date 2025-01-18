import { ChromaticAberrationEffect } from 'postprocessing'
import { type EffectProps, wrapEffect } from '../util.tsx'

export type ChromaticAberrationProps = EffectProps<typeof ChromaticAberrationEffect>
export const ChromaticAberration = /* @__PURE__ */ wrapEffect(ChromaticAberrationEffect)
