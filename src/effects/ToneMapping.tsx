import { ToneMappingEffect } from 'postprocessing'
import { type EffectProps, wrapEffect } from '../util'

export type ToneMappingProps = EffectProps<typeof ToneMappingEffect>

export const ToneMapping = /* @__PURE__ */ wrapEffect(ToneMappingEffect)
