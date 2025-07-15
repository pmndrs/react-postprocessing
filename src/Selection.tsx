import * as THREE from 'three'
import type React from 'react'
import { createContext, useState, useContext, useEffect, useRef, useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'

export type Api = {
  selected: THREE.Object3D[]
  select: React.Dispatch<React.SetStateAction<THREE.Object3D[]>>
  enabled: boolean
}
export type SelectApi = Omit<ThreeElements['group'], 'ref'> & {
  enabled?: boolean
}

export const selectionContext = /* @__PURE__ */ createContext<Api>({
  select: () => {},
  enabled: true,
  selected: []
})

export function Selection({ children, enabled = true }: { enabled?: boolean; children: React.ReactNode }) {
  const [selected, select] = useState<THREE.Object3D[]>([])
  const value = useMemo(() => ({ selected, select, enabled }), [selected, enabled])
  return <selectionContext.Provider value={value}>{children}</selectionContext.Provider>
}

export function Select({ enabled = false, children, ...props }: SelectApi) {
  const group = useRef<THREE.Group>(new THREE.Group())
  const {select = () => {}} = useContext(selectionContext)

  useEffect(() => {
    if (!enabled || !group.current) return

    const current: THREE.Object3D[] = []
    group.current.traverse((o) => {
      if (o.type === 'Mesh') current.push(o)
    })

    select((prev) => {
      const notIncluded = current.filter(obj => !prev.includes(obj))
      return notIncluded.length > 0 ? [...prev, ...notIncluded] : prev
    })

    return () => {
      select((prev) => prev.filter(obj => !current.includes(obj)))
    }
  }, [enabled, select, children])
  return (
    <group ref={group} {...props}>
      {children}
    </group>
  )
}
