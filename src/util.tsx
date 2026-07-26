import type { ReactThreeFiber } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { Vector2, type Vector2Tuple } from 'three'

export const resolveRef = <T,>(ref: T | RefObject<T>) =>
  typeof ref === 'object' && ref != null && 'current' in ref ? ref.current : ref

/**
 * r3f never disposes <primitive> objects (their state may be owned outside
 * React), so effects rendered that way must dispose themselves. Guards
 * against double-dispose across StrictMode's dev-only mount/cleanup/mount
 * cycle, where the cleanup closure re-runs against the same instance.
 */
export const useDispose = <T extends { dispose?: () => void }>(instance: T): void => {
  const disposedRef = useRef<WeakSet<object>>(new WeakSet())

  useEffect(() => {
    const disposed = disposedRef.current
    return () => {
      if (instance && typeof instance === 'object' && !disposed.has(instance)) {
        disposed.add(instance)
        instance.dispose?.()
      }
    }
  }, [instance])
}

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
