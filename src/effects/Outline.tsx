import { OutlineEffect } from 'postprocessing'
import React, { Ref, ForwardRefExoticComponent, forwardRef, useContext, useMemo } from 'react'
import { EffectComposerContext } from '../EffectComposer'

type OutlineProps = ConstructorParameters<typeof OutlineEffect>[2]

export const Outline: ForwardRefExoticComponent<OutlineEffect> = forwardRef(function Outline(
  props: OutlineProps,
  ref: Ref<OutlineEffect>
) {
  const { scene, camera } = useContext(EffectComposerContext)
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
