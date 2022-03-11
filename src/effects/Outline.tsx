import { OutlineEffect } from 'postprocessing'
import React, { Ref, MutableRefObject, forwardRef, useMemo, useEffect, useContext, useRef } from 'react'
import { Object3D } from 'three'
import { BlendFunction, KernelSize, Resizer } from 'postprocessing'
import mergeRefs from 'react-merge-refs'
import { EffectComposerContext } from '../EffectComposer'
import { selectionContext } from '../Selection'
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
    blendFunction = BlendFunction.SCREEN,
    patternTexture = null,
    edgeStrength = 1,
    pulseSpeed = 0,
    visibleEdgeColor = 0xffffff,
    hiddenEdgeColor = 0xffffff,
    width = Resizer.AUTO_SIZE,
    height = Resizer.AUTO_SIZE,
    kernelSize = KernelSize.VERY_SMALL,
    blur = false,
    xRay = true,
    ...props
  }: OutlineProps,
  forwardRef: Ref<OutlineEffect>
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

  const api = useContext(selectionContext)
  const ref = useRef<OutlineEffect>()
  useEffect(() => {
    if (api && api.enabled) {
      const effect = ref.current
      if (api.selected?.length) {
        effect.selection.set(api.selected)
        return () => void effect.selection.clear()
      }
    }
  }, [api])

  return <primitive ref={mergeRefs([ref, forwardRef])} object={effect} />
})