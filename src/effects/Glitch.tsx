import { GlitchEffect, GlitchMode } from 'postprocessing'
import React, { useMemo, useLayoutEffect } from 'react'
import { ReactThreeFiber } from 'react-three-fiber'
import { useVector2 } from '../util'

export type GlitchProps = ConstructorParameters<typeof GlitchEffect>[0] &
  Partial<{
    mode: typeof GlitchMode
    active: boolean
    delay: ReactThreeFiber.Vector2
    duration: ReactThreeFiber.Vector2
    chromaticAberrationOffset: ReactThreeFiber.Vector2
    strength: ReactThreeFiber.Vector2
  }>

export const Glitch = ({ active, ...props }: GlitchProps) => {
  const delay = useVector2(props, 'delay')
  const duration = useVector2(props, 'duration')
  const strength = useVector2(props, 'strength')
  const effect = useMemo(() => new GlitchEffect({ ...props, delay, duration, strength }), [props])
  useLayoutEffect(() => {
    effect.mode = active ? props.mode || GlitchMode.SPORADIC : GlitchMode.DISABLED
  }, [active])
  return <primitive object={effect} dispose={null} />
}
