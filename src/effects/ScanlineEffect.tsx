import { forwardRef, useImperativeHandle, useMemo, ForwardRefExoticComponent, useLayoutEffect } from 'react'
import { ScanlineEffect } from 'postprocessing'

export const Scanline: ForwardRefExoticComponent<ScanlineEffect> = forwardRef(
  ({ density, ...props }: ScanlineEffect, ref) => {
    const effect = useMemo(() => new ScanlineEffect(props), [props])

    useLayoutEffect(() => {
      if (density) {
        effect.setDensity(density)
      }
    }, [density])

    useImperativeHandle(ref, () => effect, [effect])

    return null
  }
)
