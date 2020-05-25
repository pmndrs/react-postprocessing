import { forwardRef, useImperativeHandle, useMemo, ForwardRefExoticComponent } from 'react'
import { BloomEffect, BlendFunction, KernelSize } from 'postprocessing'

const Bloom: ForwardRefExoticComponent<BloomEffect> = forwardRef((props, ref) => {
  const effect = useMemo(() => new BloomEffect(props), [props])
  useImperativeHandle(ref, () => effect, [effect])
  return null
})

export default Bloom
