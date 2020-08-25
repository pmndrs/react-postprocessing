import { SelectiveBloomEffect, BlendFunction } from 'postprocessing'
import React, { Ref, MutableRefObject, forwardRef, useMemo, useEffect, useContext } from 'react'
import { Object3D } from 'three'
import { EffectComposerContext } from '../EffectComposer'

type ObjectRef = MutableRefObject<Object3D>

export type SelectiveBloomProps = ConstructorParameters<typeof SelectiveBloomEffect>[2] &
  Partial<{
    lights?: ObjectRef[]
    selection?: ObjectRef | ObjectRef[]
    selectionLayer?: number
  }>

const addLight = (light: ObjectRef, effect: SelectiveBloomEffect) => {
  light.current.layers.enable(effect.selection.layer)
}

const removeLight = (light: ObjectRef, effect: SelectiveBloomEffect) => {
  light.current.layers.disable(effect.selection.layer)
}

export const SelectiveBloom = forwardRef(function SelectiveBloom(
  { selection = [], selectionLayer = 10, lights = [], ...otherProps }: SelectiveBloomProps,
  ref: Ref<SelectiveBloomEffect>
) {
  if (lights.length === 0) {
    console.warn('SelectiveBloom requires lights to work.')
  }

  const { scene, camera } = useContext(EffectComposerContext)
  const effect = useMemo(
    () =>
      new SelectiveBloomEffect(scene, camera, {
        blendFunction: BlendFunction.SCREEN,
        ...otherProps,
      }),
    [camera, otherProps, scene]
  )

  useEffect(() => {
    effect.selection.set(Array.isArray(selection) ? selection.map((ref) => ref.current) : [selection.current])
  }, [effect, selection])

  useEffect(() => {
    effect.selection.layer = selectionLayer
  }, [effect, selectionLayer])

  useEffect(() => {
    lights.forEach((light) => addLight(light, effect))

    return () => lights.forEach((light) => removeLight(light, effect))
  }, [effect, lights, selectionLayer])

  return <primitive ref={ref} object={effect} dispose={null} />
})
