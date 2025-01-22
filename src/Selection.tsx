import React, { createContext, useState, useContext, useEffect, useRef, useMemo } from 'react'
import { type ThreeElements } from '@react-three/fiber'
import { Group, Object3D } from 'three'

export type Api = {
  selected: Object3D[]
  select: React.Dispatch<React.SetStateAction<Object3D[]>>
  enabled: boolean
}
export type SelectApi = Omit<ThreeElements['group'], 'ref'> & {
  enabled?: boolean
}

export const selectionContext = /* @__PURE__ */ createContext<Api | null>(null)

export function Selection({ children, enabled = true }: { enabled?: boolean; children: React.ReactNode }) {
  const [selected, select] = useState<Object3D[]>([])
  const value = useMemo(() => ({ selected, select, enabled }), [selected, select, enabled])
  return <selectionContext.Provider value={value}>{children}</selectionContext.Provider>
}

export function Select({ enabled = false, children, ...props }: SelectApi) {
  const group = useRef<Group>(null!)
  const api = useContext(selectionContext)
  useEffect(() => {
    if (api && enabled) {
      let changed = false
      const current: Object3D[] = []
      group.current.traverse((o) => {
        o.type === 'Mesh' && current.push(o)
        if (api.selected.indexOf(o) === -1) changed = true
      })
      if (changed) {
        api.select((state) => [...state, ...current])
        return () => {
          api.select((state) => state.filter((selected) => !current.includes(selected)))
        }
      }
    }
  }, [enabled, children, api])
  return (
    <group ref={group} {...props}>
      {children}
    </group>
  )
}
