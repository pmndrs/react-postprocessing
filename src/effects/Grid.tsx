import { forwardRef, useMemo, useLayoutEffect, useImperativeHandle, MutableRefObject } from 'react'
import { GridEffect } from 'postprocessing'

type GridProps = ConstructorParameters<typeof GridEffect>[0] &
  Partial<{
    size: {
      width: number
      height: number
    }
  }>

export const Grid = forwardRef(({ size, ...props }: GridProps, ref: MutableRefObject<GridEffect>) => {
  const effect = useMemo(() => new GridEffect(props), [props])

  useLayoutEffect(() => {
    if (size) {
      effect.setSize(size.width, size.height)
    }
  }, [size])

  useImperativeHandle(ref, () => effect, [effect])

  return null
})
