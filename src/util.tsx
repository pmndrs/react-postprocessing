import React, { useMemo, useLayoutEffect } from 'react'
import { Vector2 } from 'three'
import { ReactThreeFiber } from 'react-three-fiber'
import { Effect, BlendFunction } from 'postprocessing'

export const wrapEffect = <T extends new (...args: any[]) => Effect>(
  effectImpl: T,
  defaultBlendMode: number = BlendFunction.NORMAL
) => ({
  blendFunction,
  opacity,
  ...props
}: React.PropsWithChildren<ConstructorParameters<T>[0]> & { opacity?: number; blendFunction?: number }) => {
  const effect: Effect = useMemo(() => new effectImpl(props), [JSON.stringify(props)])
  useLayoutEffect(() => {
    effect.blendMode.blendFunction = blendFunction || defaultBlendMode
    if (opacity !== undefined) effect.blendMode.opacity.value = opacity
  }, [blendFunction, opacity])
  return <primitive object={effect} dispose={null} />
}

export const useVector2 = (props: any, key: string): Vector2 => {
  const vec: ReactThreeFiber.Vector2 = props[key]

  return useMemo(() => {
    if (vec instanceof Vector2) {
      return new Vector2().set(vec.x, vec.y)
    } else if (Array.isArray(vec)) {
      const [x, y] = vec
      return new Vector2().set(x, y)
    }
  }, [props[key]])
}
