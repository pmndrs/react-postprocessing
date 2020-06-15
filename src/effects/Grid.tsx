import React, { forwardRef, useMemo, useLayoutEffect, useImperativeHandle } from 'react'
import { GridEffect, BlendFunction } from 'postprocessing'
import { toggleBlendMode } from '../util'

type GridProps = ConstructorParameters<typeof GridEffect>[0] &
  Partial<{
    active: boolean
    size: {
      width: number
      height: number
    }
  }>

const Grid = forwardRef(({ active = true, blendFunction, size, ...props }: GridProps, ref) => {
  const effect = useMemo(() => new GridEffect(props), [props])

  useLayoutEffect(() => {
    toggleBlendMode(effect, blendFunction || BlendFunction.OVERLAY, active)
  }, [active])

  useLayoutEffect(() => {
    if (size) {
      effect.setSize(size.width, size.height)
    }
  }, [size])

  useImperativeHandle(ref, () => effect, [effect])

  return null
})

export default Grid
