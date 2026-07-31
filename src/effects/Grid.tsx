import { useThree } from '@react-three/fiber'
import { GridEffect } from 'postprocessing'
import { Ref, useLayoutEffect, useMemo } from 'react'
import { useDispose } from '../util'

type GridProps = ConstructorParameters<typeof GridEffect>[0] &
  Partial<{
    size: {
      width: number
      height: number
    }
    ref: Ref<GridEffect>
  }>

export function Grid({ size, ref, ...props }: GridProps) {
  const invalidate = useThree((state) => state.invalidate)

  const effect = useMemo(() => new GridEffect(props), [props])

  useLayoutEffect(() => {
    if (size) effect.setSize(size.width, size.height)
    invalidate()
  }, [effect, size, invalidate])

  useDispose(effect)

  return <primitive ref={ref} object={effect} />
}
