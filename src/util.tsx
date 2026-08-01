import { useThree, type ReactThreeFiber } from '@react-three/fiber'
import type { Selection as PPSelection } from 'postprocessing'
import { use, useEffect, useMemo, useRef, type RefObject } from 'react'
import { Object3D, Vector2, type Vector2Tuple } from 'three'
import { selectionContext } from './Selection'

// Stable reference for array-typed props defaulting to "nothing" - `= []`
// as a default parameter allocates a new array on every call, which is
// enough to retrigger any effect that depends on it.
export const EMPTY_ARRAY: never[] = []

export const resolveRef = <T,>(ref: T | RefObject<T>) =>
  typeof ref === 'object' && ref != null && 'current' in ref ? ref.current : ref

/**
 * Keeps a postprocessing effect's `selection` (and its render layer) in
 * sync with either mode effects support: the manual
 * `selection` prop (used only when there's no enclosing <Selection>), or
 * the declarative Selection/Select API. The two are mutually exclusive -
 * context wins when both are present.
 */
export function useSelectionSync(
  effect: { selection: PPSelection },
  selection: Object3D | Object3D[] | RefObject<Object3D | null> | RefObject<Object3D | null>[],
  selectionLayer: number
): void {
  const invalidate = useThree((state) => state.invalidate)
  const api = use(selectionContext)

  useEffect(() => {
    effect.selection.layer = selectionLayer
    invalidate()
  }, [effect, invalidate, selectionLayer])

  useEffect(() => {
    if (api) return
    const resolved = (Array.isArray(selection) ? selection.map((o) => resolveRef(o)) : [resolveRef(selection)]).filter(
      (o): o is Object3D => o != null
    )
    if (!resolved.length) return

    effect.selection.set(resolved)
    invalidate()
    return () => {
      effect.selection.clear()
      invalidate()
    }
  }, [effect, selection, api, invalidate])

  useEffect(() => {
    if (api && api.enabled && api.selected?.length) {
      effect.selection.set(api.selected)
      invalidate()
      return () => {
        effect.selection.clear()
        invalidate()
      }
    }
  }, [api, effect.selection, invalidate])
}

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
