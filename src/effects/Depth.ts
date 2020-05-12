import { forwardRef, useImperativeHandle, useMemo, ForwardRefExoticComponent } from 'react'
import { DepthEffect } from 'postprocessing'

const Depth: ForwardRefExoticComponent<DepthEffect> = forwardRef((props, ref) => {
  const effect = useMemo(() => new DepthEffect(props), [props])
  useImperativeHandle(ref, () => effect, [effect])
  return null
})

export default Depth
