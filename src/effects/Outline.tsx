import { OutlineEffect } from 'postprocessing'
import { Ref, RefObject, use, useMemo } from 'react'
import { Object3D } from 'three'
import { EffectComposerContext } from '../EffectComposer'
import { EMPTY_ARRAY, useDispose, useSelectionSync } from '../util'

type ObjectRef = RefObject<Object3D>

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
  edgeStrength,
  pulseSpeed,
  visibleEdgeColor,
  hiddenEdgeColor,
  width,
  height,
  kernelSize,
  blur,
  xRay,
  ref,
  ...props
}: OutlineProps) {
  const { scene, camera } = use(EffectComposerContext)

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
        ...props,
      }),
    // NOTE: `props` is an unstable reference, so we can't memoize it
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  useSelectionSync(effect, selection, selectionLayer)
  useDispose(effect)

  return <primitive ref={ref} object={effect} />
}
