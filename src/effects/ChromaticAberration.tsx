import { ChromaticAberrationEffect } from 'postprocessing'
import { forwardRef, useImperativeHandle, useMemo } from 'react'
import { ReactThreeFiber } from 'react-three-fiber'
import { useVector2 } from '../util'

// type for function args should use constructor args
export type ChromaticAberrationProps = ConstructorParameters<typeof ChromaticAberrationEffect>[0] &
  Partial<{
    offset: ReactThreeFiber.Vector2
  }>

export const ChromaticAberration = forwardRef((props: ChromaticAberrationProps, ref) => {
  const offset = useVector2(props, 'offset')

  const effect = useMemo(() => new ChromaticAberrationEffect({ ...props, offset }), [props])

  useImperativeHandle(ref, () => effect, [effect])

  return null
})
