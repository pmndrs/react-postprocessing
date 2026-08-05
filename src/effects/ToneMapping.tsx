import { ToneMappingEffect } from 'postprocessing'
import type { Ref } from 'react'
import { useMemo } from 'react'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

type ToneMappingOptions = EffectOptions<typeof ToneMappingEffect>

const ToneMappingImpl = /* @__PURE__ */ createEffectComponent<typeof ToneMappingEffect, ToneMappingOptions>(
  ToneMappingEffect
)

export type ToneMappingProps = ToneMappingOptions & { opacity?: number; ref?: Ref<ToneMappingEffect> }

// minLuminance/maxLuminance have no live setter in postprocessing - routed
// through args so they still work as plain props.
export function ToneMapping({ minLuminance, maxLuminance, ...liveProps }: ToneMappingProps) {
  const args = useMemo<[ToneMappingOptions]>(() => [{ minLuminance, maxLuminance }], [minLuminance, maxLuminance])
  return <ToneMappingImpl args={args} {...liveProps} />
}
