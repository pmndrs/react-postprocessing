import { ColorAverageEffect, BlendFunction } from 'postprocessing'
import { ForwardRefExoticComponent, useMemo, forwardRef, useImperativeHandle } from 'react'

export type ColorAverageProps = Partial<{
  blendFunction: number
}>

export const ColorAverage: ForwardRefExoticComponent<ColorAverageProps> = forwardRef(
  ({ blendFunction = BlendFunction.NORMAL }: ColorAverageProps, ref) => {
    /** Because ColorAverage blendFunction is not an object but a number, we have to define a custom prop "blendFunction" */
    const effect = useMemo(() => new ColorAverageEffect(blendFunction), [blendFunction])

    useImperativeHandle(ref, () => effect, [effect])

    return null
  }
)
