import { PixelationEffect } from 'postprocessing'
import type { Ref } from 'react'
import { createEffectComponent } from '../createEffectComponent'

// PixelationEffect's sole constructor arg is a bare number, not an options
// object - granularity is a real live setter though, so it's just a normal
// prop; only the curated default (5, vs the class's own default of 30)
// needs a thin wrapper.
const PixelationImpl = /* @__PURE__ */ createEffectComponent<typeof PixelationEffect, { granularity?: number }>(
  PixelationEffect
)

export type PixelationProps = {
  granularity?: number
  ref?: Ref<PixelationEffect>
}

export function Pixelation({ granularity = 5, ref }: PixelationProps) {
  return <PixelationImpl granularity={granularity} ref={ref} />
}
