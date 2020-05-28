import { GlitchEffect, GlitchMode } from 'postprocessing'
import { ForwardRefExoticComponent, useMemo, useImperativeHandle, forwardRef, useEffect } from 'react'
import { ReactThreeFiber } from 'react-three-fiber'
import { useVector2 } from '../util'

type GlitchProps = GlitchEffect & {
  delay?: ReactThreeFiber.Vector2
  duration?: ReactThreeFiber.Vector2
  chromaticAberrationOffset?: ReactThreeFiber.Vector2
  strength?: ReactThreeFiber.Vector2
}

const Glitch: ForwardRefExoticComponent<GlitchEffect> = forwardRef((props: GlitchProps, ref) => {
  const delay = useVector2(props, 'delay')

  const duration = useVector2(props, 'duration')

  const strength = useVector2(props, 'strength')

  const mode = props.active ? props.mode || GlitchMode.SPORADIC : GlitchMode.DISABLED

  const effect = useMemo(() => new GlitchEffect({ ...props, delay, duration, strength }), [props])

  effect.mode = mode

  useImperativeHandle(ref, () => effect, [effect])

  return null
})

export default Glitch
