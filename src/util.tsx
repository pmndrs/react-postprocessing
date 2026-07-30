import type { ReactThreeFiber } from '@react-three/fiber'
import { useMemo, type RefObject } from 'react'
import { Vector2, type Vector2Tuple } from 'three'

export const resolveRef = <T,>(ref: T | RefObject<T>) =>
  typeof ref === 'object' && ref != null && 'current' in ref ? ref.current : ref

export const useVector2 = (props: Record<string, unknown>, key: string): Vector2 => {
  const value = props[key] as ReactThreeFiber.Vector2 | undefined

  return useMemo(() => {
    if (typeof value === 'number') {
      return new Vector2(value, value)
    }

    if (value) {
      return new Vector2(...(value as Vector2Tuple))
    }

    return new Vector2()
  }, [value])
}
