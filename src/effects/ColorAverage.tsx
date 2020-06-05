import { ColorAverageEffect, BlendFunction } from 'postprocessing'
import { ForwardRefExoticComponent, useMemo, forwardRef, useImperativeHandle } from 'react'

export type ColorAverageProps = {
  blendFunction?: number
}

export const ColorAverage: ForwardRefExoticComponent<ColorAverageProps> = forwardRef(
  (
    { blendFunction }: ColorAverageProps = {
      blendFunction: BlendFunction.NORMAL,
    },
    ref
  ) => {
    /** Because ColorAverage blendFunction is not an object but a number, we have to define a custom prop "blendFunction" */
    const effect = useMemo(() => new ColorAverageEffect(blendFunction), [blendFunction])

    useImperativeHandle(ref, () => effect, [effect])

    return null
  }
)
