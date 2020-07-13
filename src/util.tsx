import { forwardRef, useImperativeHandle, useMemo, ForwardRefExoticComponent, useLayoutEffect } from 'react'
import { Vector2 } from 'three'
import { ReactThreeFiber } from 'react-three-fiber'
import { Effect, BlendFunction } from 'postprocessing'

export const wrapEffect = <T extends new (...args: any[]) => Effect>(
  effectImpl: T,
  defaultBlendMode: number = BlendFunction.NORMAL
): ForwardRefExoticComponent<ConstructorParameters<typeof effectImpl>[0]> => {
  return forwardRef((props, ref) => {
    const effect: Effect = useMemo(() => new effectImpl(props), [props])

    useLayoutEffect(() => {
      effect.blendMode.blendFunction = props.blendFunction || defaultBlendMode
    }, [])

    useImperativeHandle(ref, () => effect, [effect])

    return null
  })
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
