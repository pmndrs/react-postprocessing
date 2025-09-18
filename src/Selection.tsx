import * as THREE from 'three'
import React, { createContext, useState, useContext, useEffect, useRef, useMemo } from 'react'
import { type ThreeElements } from '@react-three/fiber'

export type Api = {
  selected: THREE.Object3D[]
  select: React.Dispatch<React.SetStateAction<THREE.Object3D[]>>
  enabled: boolean
}
export type SelectApi = Omit<ThreeElements['group'], 'ref'> & {
  enabled?: boolean
}

export const selectionContext = /* @__PURE__ */ createContext<Api | null>(null)
export const selectContext = /* @__PURE__ */ createContext<Api | null>(null)

export function Selection(
  { children, enabled = true }: { enabled?: boolean; children: React.ReactNode }
) {
  const [selected, select] = useState<THREE.Object3D[]>([])
  const selectApiRef = useRef({ selected, select, enabled })
  const selectApi = selectApiRef.current

  //non-reactive api for selectContext
  selectApi.selected = selected
  selectApi.select = select
  selectApi.enabled = enabled

  const selectionApi = useMemo(() => ({ selected, select, enabled }), [selected, select, enabled])

  return (
    <selectContext.Provider value={selectApiRef.current}>
      <selectionContext.Provider value={selectionApi}>
        {children}
      </selectionContext.Provider>
    </selectContext.Provider>
  )
}

export function Select({ enabled = false, children, ...props }: SelectApi) {
  const group = useRef<THREE.Group>(null!)
  const api = useContext(selectContext)
  useEffect(() => {
    if (api && enabled) {
      let changed = false
      const current: THREE.Object3D[] = []
      group.current.traverse((o) => {
        if (o.type === 'Mesh') {
          current.push(o)
        }
        if (api.selected.indexOf(o) === -1) changed = true
      })
      if (changed) {
        api.select((state) => [...state, ...current])
        return () => {
          api.select((state) => state.filter((selected) => !current.includes(selected)))
        }
      }
    }
  }, [enabled, children, api]);
  return (
    <group ref={group} {...props}>
      {children}
    </group>
  )
}