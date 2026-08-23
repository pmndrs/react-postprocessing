import { useThree, type Instance, type ReactThreeFiber } from '@react-three/fiber'
import type { Selection as PPSelection } from 'postprocessing'
import { use, useCallback, useEffect, useLayoutEffect, useMemo, useRef, type Ref, type RefObject } from 'react'
import { Group, Object3D, Vector2, Vector3, type Vector2Tuple, type Vector3Tuple } from 'three'
import { selectionContext } from './Selection'

// Stable reference for array-typed props defaulting to "nothing" - `= []`
// as a default parameter allocates a new array on every call, which is
// enough to retrigger any effect that depends on it.
export const EMPTY_ARRAY: never[] = []

export const resolveRef = <T,>(ref: T | RefObject<T>) =>
  typeof ref === 'object' && ref != null && 'current' in ref ? ref.current : ref

// Merges a local ref with a caller-supplied ref (object or callback form).
// Clears localRef inside the callback ref's own returned cleanup, since
// React 19 never re-invokes it with null once it returns one.
export function useMergeRefs<T>(
  localRef: RefObject<T | null>,
  outerRef: Ref<T> | undefined
): (instance: T | null) => void | (() => void) {
  return useCallback(
    (instance: T | null) => {
      localRef.current = instance
      if (typeof outerRef !== 'function') {
        if (outerRef) outerRef.current = instance
        return
      }
      const cleanup = outerRef(instance)
      if (typeof cleanup !== 'function') return
      return () => {
        localRef.current = null
        cleanup()
      }
    },
    [localRef, outerRef]
  )
}

// Reads a <group>'s direct r3f children, filtered by type - transparent to
// non-host wrapper components, since r3f's instance tree already is.
export function readGroupChildren<T>(group: Group, filter: (object: unknown) => object is T): T[] {
  const groupInstance = (group as Group & { __r3f: Instance<Group> }).__r3f
  return groupInstance ? groupInstance.children.map((child) => child.object).filter(filter) : []
}

// Diffs `next` against what's stored in `ref`, updating it only when the
// contents actually changed. Returns whether it changed.
export function updateIfChanged<T>(ref: RefObject<T[]>, next: T[]): boolean {
  const previous = ref.current
  if (next.length === previous.length && next.every((item, i) => item === previous[i])) return false
  ref.current = next
  return true
}

// Keeps `selection` synced with whichever mode is active: the manual
// `selection` prop, or the declarative Selection/Select API (context wins).
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

// r3f never disposes <primitive> objects, so they must dispose themselves.
export const useDispose = <T extends { dispose?: () => void }>(instance: T): void => {
  useEffect(() => {
    return () => {
      instance?.dispose?.()
    }
  }, [instance])
}

// Reads a plain or r3f-pierced ("a-b-c") key off an object, matching what
// applyProps below can write - a single reader that works for both shapes.
export function readPierced(instance: object, key: string): unknown {
  let target: unknown = instance
  for (const part of key.split('-')) {
    if (target == null) return undefined
    target = (target as Record<string, unknown>)[part]
  }
  return target
}

// Writes a plain or r3f-pierced ("a-b-c") key, mirroring readPierced.
// Deliberately a plain assignment, not r3f's applyProps: these instances
// are built with `new`, not r3f's reconciler, so applyProps' Color/Vector
// coercion never applies to them. Callers wrap values that need coercion.
export function applyPierced(instance: object, key: string, value: unknown): void {
  const parts = key.split('-')
  let target: unknown = instance
  for (let idx = 0; idx < parts.length - 1; idx++) {
    if (target == null) return
    target = (target as Record<string, unknown>)[parts[idx]]
  }
  if (target == null) return
  ;(target as Record<string, unknown>)[parts[parts.length - 1]] = value
}

// Applies live-mutable properties onto an instance built via `new` (not
// r3f's reconciler, so r3f's own prop diffing/reset never runs on it).
// Falls back to the constructor-time default when a value is `undefined`.
// Only calls `set` when the resolved value actually changed since the last
// apply - some setters have side effects beyond storing the value (e.g.
// OutlineEffect's `multisampling` disposes its render target on every set).
export function useLiveDefaults<T extends object>(
  instance: T | RefObject<T | null> | null,
  values: Record<string, unknown>,
  keys: Iterable<string>,
  get: (instance: T, key: string) => unknown = readPierced,
  set: (instance: T, key: string, value: unknown) => void = applyPierced
): void {
  const snapshotRef = useRef<{ instance: T; defaults: Map<string, unknown>; applied: Map<string, unknown> } | null>(
    null
  )
  const invalidate = useThree((state) => state.invalidate)

  useLayoutEffect(() => {
    const resolved = resolveRef(instance)
    if (!resolved) return
    if (snapshotRef.current?.instance !== resolved) {
      snapshotRef.current = { instance: resolved, defaults: new Map(), applied: new Map() }
    }
    const { defaults, applied } = snapshotRef.current
    let changed = false

    for (const key of keys) {
      if (!defaults.has(key)) {
        // Seed `applied` too, not just `defaults`, so an unchanged key
        // skips `set` even on this first pass (avoids re-triggering
        // setters with side effects, e.g. multisampling's dispose).
        const current = get(resolved, key)
        defaults.set(key, current)
        applied.set(key, current)
      }
      const next = values[key] !== undefined ? values[key] : defaults.get(key)
      if (Object.is(applied.get(key), next)) continue
      set(resolved, key, next)
      applied.set(key, next)
      changed = true
    }

    // These instances are mutated directly (not via r3f's reconciler), so
    // r3f never sees the change - without this, frameloop="demand" would
    // never repaint after a live prop update.
    if (changed) invalidate()
  })
}

export const useVector2 = (props: Record<string, unknown>, key: string): Vector2 => {
  const value = props[key] as ReactThreeFiber.Vector2 | undefined

  return useMemo(() => {
    if (typeof value === 'number') {
      return new Vector2(value, value)
    }

    if (value instanceof Vector2) {
      return value
    }

    if (value) {
      return new Vector2(...(value as Vector2Tuple))
    }

    return new Vector2()
  }, [value])
}

export const useVector3 = (props: Record<string, unknown>, key: string): Vector3 => {
  const value = props[key] as ReactThreeFiber.Vector3 | undefined

  return useMemo(() => {
    if (typeof value === 'number') {
      return new Vector3(value, value, value)
    }

    if (value instanceof Vector3) {
      return value
    }

    if (value) {
      return new Vector3(...(value as Vector3Tuple))
    }

    return new Vector3()
  }, [value])
}
