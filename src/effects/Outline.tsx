import { OutlineEffect } from 'postprocessing'
import React, { Ref, ForwardRefExoticComponent, forwardRef, useMemo, useLayoutEffect, useEffect } from 'react'
import { useThree } from 'react-three-fiber'
import { Object3D } from 'three'

type ObjectRef = Ref<Object3D>

type OutlineProps = ConstructorParameters<typeof OutlineEffect>[2] | {
  selection: ObjectRef | ObjectRef[],
  selectionLayer: number
}

export const Outline: ForwardRefExoticComponent<OutlineEffect> = forwardRef(function Outline(
  { 
    selection = [], 
    selectionLayer = 10, 
    ...props
}: OutlineProps,
  ref: Ref<OutlineEffect>
) {
  const { scene, camera } = useThree()

  const effect = useMemo(
    () =>{

      const effect = new OutlineEffect(scene, camera, {
        xRay: true,
        edgeStrength: 2.5,
        pulseSpeed: 0.0,
        visibleEdgeColor: 0xffffff,
        hiddenEdgeColor: 0x22090a,
        ...props,
      })
    
      return effect

    },
    [camera, props, scene]
  )

  useEffect(() => { 
    effect.setSelection(Array.isArray(selection) ? selection.map(ref => ref.current) : [selection.current]) 
  }, [effect, selection])

  useEffect(() => {
    effect.selectionLayer = selectionLayer
  }, [effect, selectionLayer])

  return <primitive ref={ref} object={effect} dispose={null} />
})
