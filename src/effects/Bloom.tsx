import { forwardRef, useImperativeHandle, useMemo, ForwardRefExoticComponent } from 'react'
import { BloomEffect, BlendFunction, KernelSize } from 'postprocessing'

const Bloom: ForwardRefExoticComponent<BloomEffect> = forwardRef((props, ref) => {
  const effect = useMemo(
    () =>
      new BloomEffect({
        blendFunction: BlendFunction.SCREEN,
        kernelSize: KernelSize.VERY_LARGE,
        luminanceThreshold: 0.9,
        luminanceSmoothing: 0.07,
        height: 600,
        ...props,
      }),
    [props]
  )
  useImperativeHandle(ref, () => effect, [effect])
  return null
})

export default Bloom
