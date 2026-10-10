import { type ThreeElements } from '@react-three/fiber'
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { type Group, type Line, type Mesh, type Object3D, type Points } from 'three'

export type Api = {
  selected: Object3D[]
  select: Dispatch<SetStateAction<Object3D[]>>
  enabled: boolean
}
export type SelectApi = Omit<ThreeElements['group'], 'ref'> & {
  enabled?: boolean
  /** Keeps this subtree out of the selection, even when an ancestor Select is enabled. */
  exclude?: boolean
}

export const selectionContext = /* @__PURE__ */ createContext<Api | null>(null)

// Lets a nested Select ask its ancestors to re-traverse (e.g. when `exclude` toggles).
const refreshContext = /* @__PURE__ */ createContext<(() => void) | null>(null)

// How many Selects claim each object, so one letting go doesn't drop another's claim.
const claims = new WeakMap<Object3D, number>()
const excluded = new WeakSet<Object3D>()

function updateClaims(objects: Object3D[], delta: number): void {
  for (const o of objects) claims.set(o, (claims.get(o) ?? 0) + delta)
}

export function Selection({ children, enabled = true }: { enabled?: boolean; children: ReactNode }) {
  const [selected, select] = useState<Object3D[]>([])
  const value = useMemo(() => ({ selected, select, enabled }), [selected, select, enabled])
  return <selectionContext.Provider value={value}>{children}</selectionContext.Provider>
}

// Covers Mesh/Line/Points subclasses too, unlike `.type`.
function isSelectable(object: Object3D): boolean {
  const o = object as Partial<Mesh & Line & Points>
  return !!(o.isMesh || o.isLine || o.isPoints)
}

function collect(object: Object3D, out: Object3D[]): void {
  if (excluded.has(object)) return
  if (isSelectable(object)) out.push(object)
  for (const child of object.children) collect(child, out)
}

export function Select({ enabled = false, exclude = false, children, ...props }: SelectApi) {
  const group = useRef<Group>(null!)
  // Stable, unlike the context value - avoids retriggering off our own write.
  const select = use(selectionContext)?.select
  const refreshParent = use(refreshContext)
  const claimed = useRef<Object3D[]>([])
  const [version, bump] = useReducer((v: number) => v + 1, 0)
  const refresh = useCallback(() => {
    bump()
    refreshParent?.()
  }, [refreshParent])

  useLayoutEffect(() => {
    if (!exclude) return
    const g = group.current
    excluded.add(g)
    refreshParent?.()
    return () => {
      excluded.delete(g)
      refreshParent?.()
    }
  }, [exclude, refreshParent])

  useEffect(() => {
    if (!select) return

    const current: Object3D[] = []
    if (enabled && !exclude) for (const child of group.current.children) collect(child, current)

    const previouslyClaimed = claimed.current
    claimed.current = current
    updateClaims(previouslyClaimed, -1)
    updateClaims(current, 1)

    select((prev) => {
      const prevSet = new Set(prev)
      const toAdd = current.filter((o) => !prevSet.has(o))
      const toRemove = previouslyClaimed.filter((o) => prevSet.has(o) && !claims.get(o))
      if (!toAdd.length && !toRemove.length) return prev
      const toRemoveSet = toRemove.length ? new Set(toRemove) : null
      const kept = toRemoveSet ? prev.filter((o) => !toRemoveSet.has(o)) : prev
      return toAdd.length ? [...kept, ...toAdd] : kept
    })
  }, [enabled, exclude, children, select, version])

  // Separate from the effect above so unmount cleanup doesn't fire on every enabled/children change.
  useEffect(() => {
    return () => {
      if (!select || !claimed.current.length) return
      const released = new Set(claimed.current)
      updateClaims(claimed.current, -1)
      claimed.current = []
      select((prev) => {
        const next = prev.filter((o) => !released.has(o) || claims.get(o))
        return next.length !== prev.length ? next : prev
      })
    }
  }, [select])

  return (
    <refreshContext.Provider value={refresh}>
      <group ref={group} {...props}>
        {children}
      </group>
    </refreshContext.Provider>
  )
}
