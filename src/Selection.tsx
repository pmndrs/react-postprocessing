import * as THREE from 'three'
import React, { createContext, useState, useContext, useEffect, useRef, useMemo } from 'react'

export type Api = {
  selected: THREE.Object3D[]
  select: React.Dispatch<React.SetStateAction<THREE.Object3D[]>>
  enabled: boolean
}
export type SelectApi = JSX.IntrinsicElements['group'] & {
  enabled?: boolean
}

export const selectionContext = createContext<Api | null>(null)

export function Selection({ children, enabled = true }: { enabled?: boolean; children: React.ReactNode }) {
  const [selected, select] = useState<THREE.Object3D[]>([])
  const value = useMemo(() => ({ selected, select, enabled }), [selected, select, enabled])
  return <selectionContext.Provider value={value}>{children}</selectionContext.Provider>
}

export function Select({ enabled = false, children, ...props }: SelectApi) {
  const group = useRef<THREE.Group>(null!)
  const api = useContext(selectionContext)
  useEffect(() => {
    if (!api) return
    const current: THREE.Object3D<THREE.Event>[] = []
    group.current.traverse((o) => {
      if (o.type === 'Mesh') current.push(o)
    })
    if (enabled && current.some(o => !api.selected.includes(o))) {
      api.select(state => [...state, ...current])
    } else if (!enabled && current.some(o => api.selected.includes(o))) {
      api.select(state => state.filter(o => !current.includes(o)))
    }
  }, [enabled, children, api])
  return (
    <group ref={group} {...props}>
      {children}
    </group>
  )
}
