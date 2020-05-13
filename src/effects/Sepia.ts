import { forwardRef, useImperativeHandle, useMemo } from 'react'
import { SepiaEffect } from 'postprocessing'

const Sepia = forwardRef((props: SepiaEffect, ref) => {
  const effect = useMemo(() => new SepiaEffect(props), [props])
  useImperativeHandle(ref, () => effect, [effect])
  return null
})

export default Sepia
