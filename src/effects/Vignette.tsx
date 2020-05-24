import { forwardRef, useImperativeHandle, useMemo, ForwardRefExoticComponent } from 'react'
import { VignetteEffect } from 'postprocessing'

const Vignette: ForwardRefExoticComponent<VignetteEffect> = forwardRef((props, ref) => {
  const effect = useMemo(() => new VignetteEffect(props), [props])
  useImperativeHandle(ref, () => effect, [effect])
  return null
})

export default Vignette
