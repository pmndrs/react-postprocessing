import type { ReactThreeFiber } from '@react-three/fiber'
import { GlitchEffect, GlitchMode } from 'postprocessing'
import type { Ref } from 'react'
import { useMemo } from 'react'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

type GlitchOptions = Omit<
  EffectOptions<typeof GlitchEffect>,
  'delay' | 'duration' | 'strength' | 'chromaticAberrationOffset'
> & {
  delay?: ReactThreeFiber.Vector2
  duration?: ReactThreeFiber.Vector2
  strength?: ReactThreeFiber.Vector2
  chromaticAberrationOffset?: ReactThreeFiber.Vector2
  mode?: GlitchMode
}

const GlitchImpl = /* @__PURE__ */ createEffectComponent<typeof GlitchEffect, GlitchOptions>(GlitchEffect)

export type GlitchProps = GlitchOptions & {
  active?: boolean
  opacity?: number
  ref?: Ref<GlitchEffect>
}

// dtSize only seeds the auto-generated perturbation map at construction time
// (skipped entirely once a perturbationMap is provided) - routed through
// args so it still works as a plain prop.
export function Glitch({ active = true, mode = GlitchMode.SPORADIC, dtSize, ...props }: GlitchProps) {
  const args = useMemo<[EffectOptions<typeof GlitchEffect>]>(() => [{ dtSize }], [dtSize])
  return <GlitchImpl args={args} mode={active ? mode : GlitchMode.DISABLED} {...props} />
}
