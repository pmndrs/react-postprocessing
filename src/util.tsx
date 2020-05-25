import { forwardRef, useImperativeHandle, useMemo, ForwardRefExoticComponent } from 'react'
import { Vector2 } from 'three'
import { ReactThreeFiber } from 'react-three-fiber'

export const wrapEffect = (effectImpl: any): ForwardRefExoticComponent<typeof effectImpl> => {
  type EffectType = typeof effectImpl

  return forwardRef((props: EffectType, ref) => {
    const effect = useMemo(() => new effectImpl(props), [props])

    useImperativeHandle(ref, () => effect, [effect])

    return null
  })
}

export const useVector2 = (props: any, key: string) => {
  const vec: ReactThreeFiber.Vector2 = props[key]

  return useMemo(() => {
    if (vec instanceof Vector2) {
      return new Vector2().set(vec.x, vec.y)
    } else if (vec instanceof Array) {
      const [x, y] = vec
      return new Vector2().set(x, y)
    }
  }, [props[key]])
}
