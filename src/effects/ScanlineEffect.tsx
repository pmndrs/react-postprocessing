import { forwardRef, useImperativeHandle, useMemo, ForwardRefExoticComponent, useLayoutEffect } from 'react'
import { ScanlineEffect } from 'postprocessing'

export const Scanline: ForwardRefExoticComponent<ScanlineEffect> = forwardRef((props: ScanlineEffect, ref) => {
  const effect = useMemo(() => new ScanlineEffect(props), [props])

  useLayoutEffect(() => {
    if (props.density) {
      effect.setDensity(props.density)
    }
  }, [props.density])

  useImperativeHandle(ref, () => effect, [effect])

  return null
})
