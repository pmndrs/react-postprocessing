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

  useEffect(() => {
    if (!select || !enabled) return

    const current: Object3D[] = []
    group.current.traverse((o) => {
      if (isSelectable(o)) current.push(o)
    })

    // Diff against latest state inside the updater; bail with the same
    // reference when unchanged so React can skip the re-render.
    select((prev) => {
      const additions = current.filter((o) => !prev.includes(o))
      return additions.length ? [...prev, ...additions] : prev
    })

    return () => {
      select((prev) => {
        const next = prev.filter((o) => !current.includes(o))
        return next.length !== prev.length ? next : prev
      })
    }
  }, [enabled, children, select])

  return (
    <group ref={group} {...props}>
      {children}
    </group>
  )
}
