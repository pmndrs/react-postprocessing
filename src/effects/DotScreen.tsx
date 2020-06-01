import { DotScreenEffect } from 'postprocessing'
import { forwardRef, useLayoutEffect, useImperativeHandle, useMemo } from 'react'

type DotScreenProps = DotScreenEffect &
  Partial<{
    angle: number
  }>

export const DotScreen = forwardRef((props: DotScreenProps, ref) => {
  const effect = useMemo(() => new DotScreenEffect(props), [props])

  useLayoutEffect(() => {
    if (props.angle) {
      effect.setAngle(props.angle)
    }
  }, [props.angle])

  useImperativeHandle(ref, () => effect, [effect])
  return null
})
