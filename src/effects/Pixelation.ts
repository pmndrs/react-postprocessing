import { forwardRef, useImperativeHandle, useMemo, ForwardRefExoticComponent, Ref } from 'react'
import { PixelationEffect } from 'postprocessing'

const Pixelation: ForwardRefExoticComponent<{ granularity?: number }> = forwardRef(
  ({ granularity }: { granularity: number }, ref: Ref<PixelationEffect>) => {
    /** Because GlitchEffect granularity is not an object but a number, we have to define a custom prop "granularity" */
    const effect = useMemo(() => new PixelationEffect(granularity || 5), [granularity])

    useImperativeHandle(
      ref,
      () => {
        return effect
      },
      [effect]
    )

    return null
  }
)

export default Pixelation
