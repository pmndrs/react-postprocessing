import { useThree } from '@react-three/fiber'
import { OutlineEffect } from 'postprocessing'
import { Ref, RefObject, useContext, useEffect, useMemo } from 'react'
import { Object3D } from 'three'
import { EffectComposerContext } from '../EffectComposer'
import { selectionContext } from '../Selection'
import { resolveRef, useDispose } from '../util'

type ObjectRef = RefObject<Object3D>

export type OutlineProps = ConstructorParameters<typeof OutlineEffect>[2] &
  Partial<{
    selection: Object3D | Object3D[] | ObjectRef | ObjectRef[]
    selectionLayer: number
    ref?: Ref<OutlineEffect>
  }>

export function Outline({
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
  ref,
  ...props
}: OutlineProps) {
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
    effect.selectionLayer = selectionLayer
    invalidate()
  }, [effect, invalidate, selectionLayer])

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

  useDispose(effect)

  return <primitive ref={ref} object={effect} />
}
