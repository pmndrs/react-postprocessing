import { ReactThreeFiber, useThree } from '@react-three/fiber'
import { GlitchEffect, GlitchMode } from 'postprocessing'
import { Ref, useLayoutEffect, useMemo } from 'react'
import { useDispose, useVector2 } from '../util'

export type GlitchProps = ConstructorParameters<typeof GlitchEffect>[0] &
  Partial<{
    mode: GlitchMode
    active: boolean
    delay: ReactThreeFiber.Vector2
    duration: ReactThreeFiber.Vector2
    chromaticAberrationOffset: ReactThreeFiber.Vector2
    strength: ReactThreeFiber.Vector2
    ref?: Ref<GlitchEffect>
  }>

export function Glitch({ active = true, ref, ...props }: GlitchProps) {
  const invalidate = useThree((state) => state.invalidate)
  const delay = useVector2(props, 'delay')
  const duration = useVector2(props, 'duration')
  const strength = useVector2(props, 'strength')
  const chromaticAberrationOffset = useVector2(props, 'chromaticAberrationOffset')

  const effect = useMemo(
    () => new GlitchEffect({ ...props, delay, duration, strength, chromaticAberrationOffset }),
    [delay, duration, props, strength, chromaticAberrationOffset]
  )

  useLayoutEffect(() => {
    effect.mode = active ? props.mode || GlitchMode.SPORADIC : GlitchMode.DISABLED
    invalidate()
  }, [active, effect, invalidate, props.mode])

  useDispose(effect)

  return <primitive ref={ref} object={effect} />
}
