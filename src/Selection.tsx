import { type ThreeElements } from '@react-three/fiber'
import {
  createContext,
  use,
  useEffect,
  useMemo,
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
}

export const selectionContext = /* @__PURE__ */ createContext<Api | null>(null)

export function Selection({ children, enabled = true }: { enabled?: boolean; children: ReactNode }) {
  const [selected, select] = useState<Object3D[]>([])
  const value = useMemo(() => ({ selected, select, enabled }), [selected, select, enabled])
  return <selectionContext.Provider value={value}>{children}</selectionContext.Provider>
}

// `.type` is a free-form string; these flags cover Mesh/Line/Points subclasses too.
function isSelectable(object: Object3D): boolean {
  const o = object as Partial<Mesh & Line & Points>
  return !!(o.isMesh || o.isLine || o.isPoints)
}

export function Select({ enabled = false, children, ...props }: SelectApi) {
  const group = useRef<Group>(null!)
  // Stable setter, unlike the context value - avoids retriggering off our own write.
  const select = use(selectionContext)?.select
  // What this Select currently has claimed in `selected`, so a re-run
  // diffs against that instead of unconditionally clearing and re-adding through effect cleanup.
  const claimed = useRef<Object3D[]>([])

  useEffect(() => {
    if (!select) return

    const current: Object3D[] = []
    if (enabled) {
      group.current.traverse((o) => {
        if (isSelectable(o)) current.push(o)
      })
    }

    const previouslyClaimed = claimed.current
    claimed.current = current

    select((prev) => {
      // Add anything missing from live state - covers both the normal
      // case and re-asserting a claim some other Select's own update
      // dropped in the meantime (nested Selects share objects). Only
      // remove what this Select itself is no longer claiming.
      const toAdd = current.filter((o) => !prev.includes(o))
      const toRemove = previouslyClaimed.filter((o) => !current.includes(o) && prev.includes(o))
      if (!toAdd.length && !toRemove.length) return prev
      const kept = toRemove.length ? prev.filter((o) => !toRemove.includes(o)) : prev
      return toAdd.length ? [...kept, ...toAdd] : kept
    })
  }, [enabled, children, select])

  // Only for unmount - a separate effect so it doesn't fire on every
  // enabled/children change like the diffing effect above does.
  useEffect(() => {
    return () => {
      if (!select || !claimed.current.length) return
      const stillClaimed = claimed.current
      select((prev) => prev.filter((o) => !stillClaimed.includes(o)))
    }
  }, [select])

  return (
    <group ref={group} {...props}>
      {children}
    </group>
  )
}
