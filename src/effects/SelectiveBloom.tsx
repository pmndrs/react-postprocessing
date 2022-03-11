import { SelectiveBloomEffect, BlendFunction } from 'postprocessing'
import React, { Ref, MutableRefObject, forwardRef, useMemo, useEffect, useContext, useRef } from 'react'
import { Object3D } from 'three'
import mergeRefs from 'react-merge-refs'
import { EffectComposerContext } from '../EffectComposer'
import { selectionContext } from '../Selection'
import { resolveRef } from '../util'

type ObjectRef = MutableRefObject<Object3D>

export type SelectiveBloomProps = ConstructorParameters<typeof SelectiveBloomEffect>[2] &
  Partial<{
    lights: Object3D[] | ObjectRef[]
    selection: Object3D | Object3D[] | ObjectRef | ObjectRef[]
    selectionLayer: number
  }>

const addLight = (light: Object3D, effect: SelectiveBloomEffect) => light.layers.enable(effect.selection.layer)
const removeLight = (light: Object3D, effect: SelectiveBloomEffect) => light.layers.disable(effect.selection.layer)

export const SelectiveBloom = forwardRef(function SelectiveBloom(
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
  }: SelectiveBloomProps,
  forwardRef: Ref<SelectiveBloomEffect>
) {
  if (lights.length === 0) {
    console.warn('SelectiveBloom requires lights to work.')
  }

  const { scene, camera } = useContext(EffectComposerContext)
  const effect = useMemo(
    () =>
      new SelectiveBloomEffect(scene, camera, {
        blendFunction: BlendFunction.SCREEN,
        luminanceThreshold,
        luminanceSmoothing,
        intensity,
        width,
        height,
        kernelSize,
      }),
    [camera, height, intensity, kernelSize, luminanceSmoothing, luminanceThreshold, scene, width]
  )

  useEffect(() => {
    if (selection) {
      effect.selection.set(Array.isArray(selection) ? selection.map(resolveRef) : [resolveRef(selection)])
      return () => void effect.selection.clear()
    }
  }, [effect, selection])

  useEffect(() => {
    effect.selection.layer = selectionLayer
  }, [effect, selectionLayer])

  useEffect(() => {
    if (lights && lights.length > 0) {
      lights.forEach((light) => addLight(resolveRef(light), effect))
      return () => lights.forEach((light) => removeLight(resolveRef(light), effect))
    }
  }, [effect, lights, selectionLayer])

  const api = useContext(selectionContext)
  const ref = useRef<SelectiveBloomEffect>()
  useEffect(() => {
    if (api && api.enabled) {
      const effect = ref.current
      if (api.selected?.length) {
        effect.selection.set(api.selected)
        return () => void effect.selection.clear()
      }
    }
  }, [api])

  return <primitive ref={mergeRefs([ref, forwardRef])} object={effect} dispose={null} />
})
