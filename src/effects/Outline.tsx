import { OutlineEffect } from 'postprocessing'
import React, { Ref, ForwardRefExoticComponent, forwardRef, useMemo } from 'react'
import { useThree } from 'react-three-fiber'

type OutlineProps = ConstructorParameters<typeof OutlineEffect>[2]

export const Outline: ForwardRefExoticComponent<OutlineEffect> = forwardRef(function Outline(
  props: OutlineProps,
  ref: Ref<OutlineEffect>
) {
  const { scene, camera } = useThree()
  const effect = useMemo(
    () =>
      new OutlineEffect(scene, camera, {
        xRay: true,
        edgeStrength: 2.5,
        pulseSpeed: 0.0,
        visibleEdgeColor: 0xffffff,
        hiddenEdgeColor: 0x22090a,
        ...props,
      }),
    [camera, props, scene]
  )
  return <primitive ref={ref} object={effect} dispose={null} />
})
