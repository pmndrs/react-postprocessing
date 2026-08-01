import { OutlineEffect } from 'postprocessing'
import { Ref, RefObject, use, useMemo } from 'react'
import { Object3D } from 'three'
import { EffectComposerContext } from '../EffectComposer'
import { EMPTY_ARRAY, useDispose, useSelectionSync } from '../util'

type ObjectRef = RefObject<Object3D | null>

export type OutlineProps = ConstructorParameters<typeof OutlineEffect>[2] &
  Partial<{
    selection: Object3D | Object3D[] | ObjectRef | ObjectRef[]
    selectionLayer: number
    ref?: Ref<OutlineEffect>
  }>

export function Outline({
  selection = EMPTY_ARRAY,
  selectionLayer = 10,
  blendFunction,
  patternTexture,
  patternScale,
  edgeStrength,
  pulseSpeed,
  visibleEdgeColor,
  hiddenEdgeColor,
  multisampling,
  resolutionScale,
  resolutionX,
  resolutionY,
  width,
  height,
  kernelSize,
  blur,
  xRay,
  ref,
}: OutlineProps) {
  const { scene, camera } = use(EffectComposerContext)

  const effect = useMemo(
    () =>
      new OutlineEffect(scene, camera, {
        blendFunction,
        patternTexture,
        patternScale,
        edgeStrength,
        pulseSpeed,
        visibleEdgeColor,
        hiddenEdgeColor,
        multisampling,
        resolutionScale,
        resolutionX,
        resolutionY,
        width,
        height,
        kernelSize,
        blur,
        xRay,
      }),
    [
      blendFunction,
      patternTexture,
      patternScale,
      edgeStrength,
      pulseSpeed,
      visibleEdgeColor,
      hiddenEdgeColor,
      multisampling,
      resolutionScale,
      resolutionX,
      resolutionY,
      width,
      height,
      kernelSize,
      blur,
      xRay,
      camera,
      scene,
    ]
  )

  useSelectionSync(effect, selection, selectionLayer)
  useDispose(effect)

  return <primitive ref={ref} object={effect} />
}
