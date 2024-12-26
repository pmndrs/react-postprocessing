import React, { Ref, forwardRef, useMemo, useLayoutEffect } from 'react'
import { GridEffect } from 'postprocessing'
import { useThree } from '@react-three/fiber'

type GridProps = ConstructorParameters<typeof GridEffect>[0] &
  Partial<{
    size: {
      width: number
      height: number
    }
  }>

export const Grid = forwardRef(function Grid({ size, ...props }: GridProps, ref: Ref<GridEffect>) {
  const invalidate = useThree((state) => state.invalidate)
  const effect = useMemo(() => new GridEffect(props), [props])
  useLayoutEffect(() => {
    if (size) effect.setSize(size.width, size.height)
    invalidate()
  }, [effect, size, invalidate])
  return <primitive ref={ref} object={effect} dispose={null} />
})
