import { SMAAEffect } from 'postprocessing'
import type { Ref } from 'react'
import { useMemo } from 'react'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

type SMAAOptions = EffectOptions<typeof SMAAEffect>

const SMAAImpl = /* @__PURE__ */ createEffectComponent<typeof SMAAEffect, SMAAOptions>(SMAAEffect)

export type SMAAProps = SMAAOptions & { opacity?: number; ref?: Ref<SMAAEffect> }

// preset/edgeDetectionMode/predicationMode have no live setter in
// postprocessing - routed through args so they still work as plain props.
export function SMAA({ preset, edgeDetectionMode, predicationMode, ...liveProps }: SMAAProps) {
  const args = useMemo<[SMAAOptions]>(
    () => [{ preset, edgeDetectionMode, predicationMode }],
    [preset, edgeDetectionMode, predicationMode]
  )
  return <SMAAImpl args={args} {...liveProps} />
}
