import { ChromaticAberrationEffect } from 'postprocessing'
import { ForwardRefExoticComponent, forwardRef, useImperativeHandle, useMemo } from 'react'
import { ReactThreeFiber } from 'react-three-fiber'
import { useVector2 } from '../util'

export type ChromaticAberrationProps = ChromaticAberrationEffect &
  Partial<{
    offset: ReactThreeFiber.Vector2
  }>

export const ChromaticAberration: ForwardRefExoticComponent<ChromaticAberrationEffect> = forwardRef((props, ref) => {
  const offset = useVector2(props, 'offset')

  const effect = useMemo(() => new ChromaticAberrationEffect({ ...props, offset }), [props])

  useImperativeHandle(ref, () => effect, [effect])

  return null
})
