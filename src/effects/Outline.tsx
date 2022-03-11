import { OutlineEffect } from 'postprocessing'
import React, { Ref, MutableRefObject, forwardRef, useMemo, useEffect, useContext, useRef } from 'react'
import { Object3D } from 'three'
import { useThree } from '@react-three/fiber'
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
  forwardRef: Ref<OutlineEffect>
) {
  const invalidate = useThree((state) => state.invalidate)
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
      invalidate()
      return () => {
        effect.selection.clear()
        invalidate()
      }
    }
  }, [effect, selection])

  useEffect(() => {
    effect.selectionLayer = selectionLayer
    invalidate()
  }, [effect, selectionLayer])

  const api = useContext(selectionContext)
  const ref = useRef<OutlineEffect>()
  useEffect(() => {
    if (api && api.enabled) {
      const effect = ref.current
      if (api.selected?.length) {
        effect.selection.set(api.selected)
        invalidate()
        return () => {
          effect.selection.clear()
          invalidate()
        }
      }
    }
  }, [api])

  return <primitive ref={mergeRefs([ref, forwardRef])} object={effect} />
})
