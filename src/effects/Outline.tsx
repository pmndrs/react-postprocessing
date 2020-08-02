import { OutlineEffect } from 'postprocessing'
import React, { useMemo } from 'react'
import { useThree } from 'react-three-fiber'

type OutlineProps = ConstructorParameters<typeof OutlineEffect>[2]

export const Outline = (props: OutlineProps) => {
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
    [props]
  )
  return <primitive object={effect} dispose={null} />
}
