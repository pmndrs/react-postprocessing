import { useThree } from '@react-three/fiber'
import type { BloomEffectOptions } from 'postprocessing'
import { BlendFunction, SelectiveBloomEffect } from 'postprocessing'
import { Ref, RefObject, use, useEffect, useMemo } from 'react'
import { Object3D } from 'three'
import { EffectComposerContext } from '../EffectComposer'
import { EMPTY_ARRAY, resolveRef, useDispose, useLiveDefaults, useSelectionSync } from '../util'

type ObjectRef = RefObject<Object3D | null>

export type SelectiveBloomProps = BloomEffectOptions &
  Partial<{
    lights: Object3D[] | ObjectRef[]
    selection: Object3D | Object3D[] | ObjectRef | ObjectRef[]
    selectionLayer: number
    inverted: boolean
    ignoreBackground: boolean
    ref?: Ref<SelectiveBloomEffect>
  }>

const addLight = (light: Object3D, effect: SelectiveBloomEffect) => light.layers.enable(effect.selection.layer)
const removeLight = (light: Object3D, effect: SelectiveBloomEffect) => light.layers.disable(effect.selection.layer)

// BloomEffect (which SelectiveBloomEffect extends) only exposes real
// setters for these - luminanceThreshold/luminanceSmoothing/mipmapBlur/
// radius/levels/resolution* are construction-only in postprocessing itself.
// scene/camera being required constructor args also rules out
// createEffectComponent (needs `new Effect()` to work with zero args).
const LIVE_KEYS = ['width', 'height', 'kernelSize', 'intensity', 'inverted', 'ignoreBackground']

export function SelectiveBloom({
  selection = EMPTY_ARRAY,
  selectionLayer = 10,
  lights = EMPTY_ARRAY,
  luminanceThreshold,
  luminanceSmoothing,
  mipmapBlur,
  radius,
  levels,
  resolutionScale,
  resolutionX,
  resolutionY,
  ref,
  ...liveProps
}: SelectiveBloomProps) {
  const { scene, camera } = use(EffectComposerContext)

  const invalidate = useThree((state) => state.invalidate)

  const effect = useMemo(
    () =>
      new SelectiveBloomEffect(scene, camera, {
        blendFunction: BlendFunction.ADD,
        luminanceThreshold,
        luminanceSmoothing,
        mipmapBlur,
        radius,
        levels,
        resolutionScale,
        resolutionX,
        resolutionY,
      }),
    [scene, camera, luminanceThreshold, luminanceSmoothing, mipmapBlur, radius, levels, resolutionScale, resolutionX, resolutionY]
  )

  useLiveDefaults(effect, liveProps as Record<string, unknown>, LIVE_KEYS)

  // Must run before the lights effect below: addLight/removeLight read
  // effect.selection.layer live, so it needs to already reflect the
  // latest selectionLayer by the time lights get (re-)assigned to it.
  useSelectionSync(effect, selection, selectionLayer)

  useEffect(() => {
    if (lights.length === 0) {
      console.warn('SelectiveBloom requires lights to work.')
      return
    }

    // Refs may not have attached yet - resolve and drop nullish entries
    // rather than crashing addLight/removeLight on a null object.
    const resolvedLights = lights.map((light) => resolveRef(light)).filter((light): light is Object3D => light != null)
    if (resolvedLights.length === 0) return

    resolvedLights.forEach((light) => addLight(light, effect))

    invalidate()

    return () => {
      resolvedLights.forEach((light) => removeLight(light, effect))

      invalidate()
    }
  }, [effect, invalidate, lights, selectionLayer])

  useDispose(effect)

  return <primitive ref={ref} object={effect} />
}
