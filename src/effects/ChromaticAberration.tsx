import { ChromaticAberrationEffect, BlendFunction } from 'postprocessing'
import { forwardRef, useImperativeHandle, useMemo, useLayoutEffect } from 'react'
import { ReactThreeFiber } from 'react-three-fiber'
import { useVector2, toggleBlendMode } from '../util'

// type for function args should use constructor args
export type ChromaticAberrationProps = ConstructorParameters<typeof ChromaticAberrationEffect>[0] &
  Partial<{
    offset: ReactThreeFiber.Vector2
    active: boolean
  }>

export const ChromaticAberration = forwardRef(({ active = true, ...props }: ChromaticAberrationProps, ref) => {
  const offset = useVector2(props, 'offset')

  const effect = useMemo(() => new ChromaticAberrationEffect({ ...props, offset }), [props])

  useLayoutEffect(() => {
    toggleBlendMode(effect, BlendFunction.NORMAL || props.blendFunction, active)
  }, [active])

  useImperativeHandle(ref, () => effect, [effect])

  return null
})
