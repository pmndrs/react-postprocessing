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

// Covers Mesh/Line/Points subclasses too, unlike `.type`.
function isSelectable(object: Object3D): boolean {
  const o = object as Partial<Mesh & Line & Points>
  return !!(o.isMesh || o.isLine || o.isPoints)
}

export function Select({ enabled = false, children, ...props }: SelectApi) {
  const group = useRef<Group>(null!)
  // Stable, unlike the context value - avoids retriggering off our own write.
  const select = use(selectionContext)?.select
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
      const prevSet = new Set(prev)
      const currentSet = new Set(current)
      const toAdd = current.filter((o) => !prevSet.has(o))
      const toRemove = previouslyClaimed.filter((o) => !currentSet.has(o) && prevSet.has(o))
      if (!toAdd.length && !toRemove.length) return prev
      const toRemoveSet = toRemove.length ? new Set(toRemove) : null
      const kept = toRemoveSet ? prev.filter((o) => !toRemoveSet.has(o)) : prev
      return toAdd.length ? [...kept, ...toAdd] : kept
    })
  }, [enabled, children, select])

  // Separate from the effect above so unmount cleanup doesn't fire on every enabled/children change.
  useEffect(() => {
    return () => {
      if (!select || !claimed.current.length) return
      const stillClaimed = new Set(claimed.current)
      select((prev) => {
        const next = prev.filter((o) => !stillClaimed.has(o))
        return next.length !== prev.length ? next : prev
      })
    }
  }, [select])

  return (
    <group ref={group} {...props}>
      {children}
    </group>
  )
}
