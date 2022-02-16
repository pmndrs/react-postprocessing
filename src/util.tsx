import React, { forwardRef, useMemo, useLayoutEffect, MutableRefObject } from 'react'
import { Vector2, Object3D } from 'three'
import { ReactThreeFiber } from '@react-three/fiber'
import { Effect, BlendFunction } from 'postprocessing'

type ObjectRef = MutableRefObject<Object3D>
type DefaultProps = Partial<{ blendFunction: BlendFunction; opacity: number }>

const isRef = (ref: any): ref is ObjectRef => !!ref.current

export const resolveRef = (ref: Object3D | ObjectRef) => (isRef(ref) ? ref.current : ref)

export const wrapEffect = <T extends new (...args: any[]) => Effect>(
  effectImpl: T,
  defaultBlendMode: BlendFunction = BlendFunction.NORMAL
) =>
  forwardRef<T, ConstructorParameters<typeof effectImpl>[0] & DefaultProps>(function Wrap(
    { blendFunction, opacity, ...props }: React.PropsWithChildren<DefaultProps & ConstructorParameters<T>[0]>,
    ref
  ) {
    const effect: Effect = useMemo(() => new effectImpl(props), [props])

    useLayoutEffect(() => {
      effect.blendMode.blendFunction = blendFunction || defaultBlendMode
      if (opacity !== undefined) effect.blendMode.opacity.value = opacity
    }, [blendFunction, effect.blendMode, opacity])
    return <primitive ref={ref} object={effect} dispose={null} />
  })

export const useVector2 = (props: any, key: string): Vector2 => {
  const vec: ReactThreeFiber.Vector2 = props[key]
  return useMemo(() => {
    if (vec instanceof Vector2) {
      return new Vector2().set(vec.x, vec.y)
    } else if (Array.isArray(vec)) {
      const [x, y] = vec
      return new Vector2().set(x, y)
    }
  }, [vec])
}