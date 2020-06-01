import { forwardRef, useImperativeHandle, useMemo, ForwardRefExoticComponent, Ref } from 'react'
import { PixelationEffect } from 'postprocessing'

export const Pixelation: ForwardRefExoticComponent<{ granularity?: number }> = forwardRef(
  (
    { granularity }: { granularity: number } = {
      granularity: 5,
    },
    ref: Ref<PixelationEffect>
  ) => {
    /** Because GlitchEffect granularity is not an object but a number, we have to define a custom prop "granularity" */
    const effect = useMemo(() => new PixelationEffect(granularity), [granularity])

    useImperativeHandle(ref, () => effect, [effect])

    return null
  }
)
