import React, { useMemo, useLayoutEffect } from 'react'
import { GridEffect } from 'postprocessing'

type GridProps = ConstructorParameters<typeof GridEffect>[0] &
  Partial<{
    size: {
      width: number
      height: number
    }
  }>

export const Grid = ({ size, ...props }: GridProps) => {
  const effect = useMemo(() => new GridEffect(props), [props])
  useLayoutEffect(() => {
    if (size) effect.setSize(size.width, size.height)
  }, [size])
  return <primitive object={effect} dispose={null} />
}
