import type { ReactThreeFiber } from '@react-three/fiber'
import { ChromaticAberrationEffect } from 'postprocessing'
import type { Ref } from 'react'
import { useMemo } from 'react'
import { useDispose, useVector2 } from '../util'

export type ChromaticAberrationProps = Omit<
  Partial<ConstructorParameters<typeof ChromaticAberrationEffect>[0]>,
  'offset'
> & {
  ref?: Ref<ChromaticAberrationEffect>
  offset?: ReactThreeFiber.Vector2
}

export function ChromaticAberration({ ref, ...props }: ChromaticAberrationProps) {
  const offset = useVector2(props, 'offset')

  const effect = useMemo(
    () =>
      new ChromaticAberrationEffect({
        ...props,
        offset,
      } as ConstructorParameters<typeof ChromaticAberrationEffect>[0]),
    [offset, props]
  )

  useDispose(effect)

  return <primitive object={effect} ref={ref} />
}
