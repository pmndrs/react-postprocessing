import { forwardRef, useImperativeHandle, useMemo, ForwardRefExoticComponent } from 'react'
import { GlitchEffect } from 'postprocessing'

const Glitch: ForwardRefExoticComponent<GlitchEffect> = forwardRef((props, ref) => {
  const effect = useMemo(() => new GlitchEffect(props), [props])

  useImperativeHandle(
    ref,
    () => {
      return effect
    },
    [effect]
  )

  return null
})

export default Glitch
