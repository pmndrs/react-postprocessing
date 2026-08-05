import type { ReactThreeFiber } from '@react-three/fiber'
import { ChromaticAberrationEffect } from 'postprocessing'
import type { Ref } from 'react'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

// radialModulation/modulationOffset are typed as required by postprocessing's
// own .d.ts, but its JSDoc confirms both are optional with defaults - an
// upstream declaration bug, not a real constraint.
export type ChromaticAberrationProps = Omit<
  EffectOptions<typeof ChromaticAberrationEffect>,
  'offset' | 'radialModulation' | 'modulationOffset'
> & {
  offset?: ReactThreeFiber.Vector2
  radialModulation?: boolean
  modulationOffset?: number
  ref?: Ref<ChromaticAberrationEffect>
}

export const ChromaticAberration = /* @__PURE__ */ createEffectComponent<
  typeof ChromaticAberrationEffect,
  ChromaticAberrationProps
>(ChromaticAberrationEffect)
