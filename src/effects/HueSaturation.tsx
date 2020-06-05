import { HueSaturationEffect } from 'postprocessing'
import { ForwardRefExoticComponent, forwardRef, useLayoutEffect, useMemo, useImperativeHandle } from 'react'

export type HueSaturationProps = HueSaturationEffect &
  Partial<{
    hue: number
  }>

export const HueSaturation: ForwardRefExoticComponent<HueSaturationEffect> = forwardRef(
  ({ hue, ...props }: HueSaturationProps, ref) => {
    const effect = useMemo(() => new HueSaturationEffect(props), [props])

    useLayoutEffect(() => {
      if (hue) {
        effect.setHue(hue)
      }
    }, [hue])

    useImperativeHandle(ref, () => effect, [effect])

    return null
  }
)
