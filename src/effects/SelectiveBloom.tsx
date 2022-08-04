import { SelectiveBloomEffect, BlendFunction } from 'postprocessing'
import React, { Ref, MutableRefObject, forwardRef, useMemo, useEffect, useContext, useRef } from 'react'
import { Object3D } from 'three'
import { useThree } from '@react-three/fiber'
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
    mipmapBlur,
    radius,
    levels,
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
        radius,
        levels,
        ...props,
      }),
    [
      camera,
      height,
      intensity,
      kernelSize,
      luminanceSmoothing,
      luminanceThreshold,
      scene,
      width,
      height,
      mipmapBlur,
      radius,
      levels,
    ]
  )

  const api = useContext(selectionContext)

  useEffect(() => {
    // Do not allow array selection if declarative selection is active
    // TODO: array selection should probably be deprecated altogether
    if (!api && selection) {
      effect.selection.set(Array.isArray(selection) ? selection.map(resolveRef) : [resolveRef(selection)])
      invalidate()
      return () => {
        effect.selection.clear()
        invalidate()
      }
    }
  }, [effect, selection, api])

  useEffect(() => {
    effect.selection.layer = selectionLayer
    invalidate()
  }, [effect, selectionLayer])

  useEffect(() => {
    if (lights && lights.length > 0) {
      lights.forEach((light) => addLight(resolveRef(light), effect))
      invalidate()
      return () => {
        lights.forEach((light) => removeLight(resolveRef(light), effect))
        invalidate()
      }
    }
  }, [effect, lights, selectionLayer])

  const ref = useRef<SelectiveBloomEffect>()
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
  }, [api])

  return <primitive ref={forwardRef} object={effect} dispose={null} />
})
