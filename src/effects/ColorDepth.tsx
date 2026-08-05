import { ColorDepthEffect } from 'postprocessing'
import type { Ref } from 'react'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

const ColorDepthImpl = /* @__PURE__ */ createEffectComponent<
  typeof ColorDepthEffect,
  Omit<EffectOptions<typeof ColorDepthEffect>, 'bits'> & { bitDepth?: number }
>(ColorDepthEffect)

export type ColorDepthProps = EffectOptions<typeof ColorDepthEffect> & {
  opacity?: number
  ref?: Ref<ColorDepthEffect>
}

// bits (the constructor's option name) has no live setter of its own in
// postprocessing - only the differently-named bitDepth does (bits is a
// plain, dead field on the instance). Renamed here so it still works as a
// plain prop after the initial mount.
export function ColorDepth({ bits, ...props }: ColorDepthProps) {
  // Only set bitDepth when bits is actually provided - r3f's reset-on-
  // removal only fires when a key is absent from the new props, not when
  // it's present but undefined.
  if (bits !== undefined) (props as Record<string, unknown>).bitDepth = bits
  return <ColorDepthImpl {...props} />
}
