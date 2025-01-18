import { SelectiveBloomEffect, BlendFunction } from 'postprocessing'
import type { BloomEffectOptions } from 'postprocessing'
import React, { Ref, RefObject, forwardRef, useMemo, useEffect, useContext, useRef } from 'react'
import { Object3D } from 'three'
import { useThree } from '@react-three/fiber'
import { EffectComposerContext } from '../EffectComposer.tsx'
import { selectionContext } from '../Selection.tsx'
import { resolveRef } from '../util.tsx'

type ObjectRef = RefObject<Object3D>

export type SelectiveBloomProps = BloomEffectOptions &
  Partial<{
    lights: Object3D[] | ObjectRef[]
    selection: Object3D | Object3D[] | ObjectRef | ObjectRef[]
    selectionLayer: number
  }>

const addLight = (light: Object3D, effect: SelectiveBloomEffect) => light.layers.enable(effect.selection.layer)
const removeLight = (light: Object3D, effect: SelectiveBloomEffect) => light.layers.disable(effect.selection.layer)

export const SelectiveBloom = /* @__PURE__ */ forwardRef(function SelectiveBloom(
  {
    selection = [],
    selectionLayer = 10,
    lights = [],
    luminanceThreshold,
    luminanceSmoothing,
    intensity,
    width,
    height,
    kernelSize,
    mipmapBlur,

    ...props
  }: SelectiveBloomProps,
  forwardRef: Ref<SelectiveBloomEffect>
) {
  if (lights.length === 0) {
    console.warn('SelectiveBloom requires lights to work.')
  }

  const invalidate = useThree((state) => state.invalidate)
  const { scene, camera } = useContext(EffectComposerContext)
  const effect = useMemo(
    () =>
      new SelectiveBloomEffect(scene, camera, {
        blendFunction: BlendFunction.ADD,
        luminanceThreshold,
        luminanceSmoothing,
        intensity,
        width,
        height,
        kernelSize,
        mipmapBlur,
        ...props,
      }),
    [scene, camera, luminanceThreshold, luminanceSmoothing, intensity, width, height, kernelSize, mipmapBlur, props]
  )

  const api = useContext(selectionContext)

  useEffect(() => {
    // Do not allow array selection if declarative selection is active
    // TODO: array selection should probably be deprecated altogether
    if (!api && selection) {
      effect.selection.set(
        Array.isArray(selection) ? (selection as Object3D[]).map(resolveRef) : [resolveRef(selection) as Object3D]
      )
      invalidate()
      return () => {
        effect.selection.clear()
        invalidate()
      }
    }
  }, [effect, selection, api, invalidate])

  useEffect(() => {
    effect.selection.layer = selectionLayer
    invalidate()
  }, [effect, invalidate, selectionLayer])

  useEffect(() => {
    if (lights && lights.length > 0) {
      lights.forEach((light) => addLight(resolveRef(light), effect))
      invalidate()
      return () => {
        lights.forEach((light) => removeLight(resolveRef(light), effect))
        invalidate()
      }
    }
  }, [effect, invalidate, lights, selectionLayer])

  useEffect(() => {
    if (api && api.enabled) {
      if (api.selected?.length) {
        effect.selection.set(api.selected)
        invalidate()
        return () => {
          effect.selection.clear()
          invalidate()
        }
      }
    }
  }, [api, effect.selection, invalidate])

  return <primitive ref={forwardRef} object={effect} dispose={null} />
})
