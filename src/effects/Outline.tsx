import { OutlineEffect } from 'postprocessing'
import React, { Ref, MutableRefObject, forwardRef, useMemo, useEffect, useContext } from 'react'
import { Object3D } from 'three'
import { EffectComposerContext } from '../EffectComposer'
import { resolveRef } from '../util'

type ObjectRef = MutableRefObject<Object3D>

export type OutlineProps = ConstructorParameters<typeof OutlineEffect>[2] &
  Partial<{
    selection: Object3D | Object3D[] | ObjectRef | ObjectRef[]
    selectionLayer: number
  }>

export const Outline = forwardRef(function Outline(
  {
    selection = [],
    selectionLayer = 10,
    blendFunction,
    patternTexture,
    edgeStrength,
    pulseSpeed,
    visibleEdgeColor,
    hiddenEdgeColor,
    width,
    height,
    kernelSize,
    blur,
    xRay,
    ...props
  }: OutlineProps,
  ref: Ref<OutlineEffect>
) {
  const { scene, camera } = useContext(EffectComposerContext)
  const effect = useMemo(
    () =>
      new OutlineEffect(scene, camera, {
        blendFunction,
        patternTexture,
        edgeStrength,
        pulseSpeed,
        visibleEdgeColor,
        hiddenEdgeColor,
        width,
        height,
        kernelSize,
        blur,
        xRay,
      }),
    [
      blendFunction,
      blur,
      camera,
      edgeStrength,
      height,
      hiddenEdgeColor,
      kernelSize,
      patternTexture,
      pulseSpeed,
      scene,
      visibleEdgeColor,
      width,
      xRay,
    ]
  )

  useEffect(() => {
    if (selection) {
      effect.selection.set(Array.isArray(selection) ? selection.map(resolveRef) : [resolveRef(selection)])
      return () => void effect.selection.clear()
    }
  }, [effect, selection])

  useEffect(() => {
    effect.selectionLayer = selectionLayer
  }, [effect, selectionLayer])

  return <primitive ref={ref} object={effect} dispose={null} />
})
