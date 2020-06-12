import { ColorAverageEffect, BlendFunction } from 'postprocessing'
import { ForwardRefExoticComponent, useMemo, forwardRef, useImperativeHandle, useLayoutEffect } from 'react'
import { toggleBlendMode } from '../util'

export type ColorAverageProps = Partial<{
  active: boolean
  blendFunction: number
}>

export const ColorAverage: ForwardRefExoticComponent<ColorAverageProps> = forwardRef(
  ({ active = true, blendFunction = BlendFunction.NORMAL }: ColorAverageProps, ref) => {
    /** Because ColorAverage blendFunction is not an object but a number, we have to define a custom prop "blendFunction" */
    const effect = useMemo(() => new ColorAverageEffect(blendFunction), [blendFunction])

    useLayoutEffect(() => {
      toggleBlendMode(effect, blendFunction, active)
    }, [active])

    useImperativeHandle(ref, () => effect, [effect])

    return null
  }
)
