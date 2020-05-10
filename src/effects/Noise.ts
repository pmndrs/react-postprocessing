import { forwardRef, useImperativeHandle, useMemo, ForwardRefExoticComponent } from 'react'
import { NoiseEffect } from 'postprocessing'

const Noise: ForwardRefExoticComponent<NoiseEffect> = forwardRef((props, ref) => {
  const effect = useMemo(() => new NoiseEffect(props), [props])

  useImperativeHandle(
    ref,
    () => {
      return effect
    },
    [effect]
  )

  return null
})

export default Noise
