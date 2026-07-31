import type { ReactThreeFiber } from '@react-three/fiber'
import { DepthOfFieldEffect, MaskFunction } from 'postprocessing'
import type { Ref } from 'react'
import { use, useMemo } from 'react'
import { type DepthPackingStrategies, type Texture, Vector3 } from 'three'
import { EffectComposerContext } from '../EffectComposer'
import { useDispose } from '../util'

export type DepthOfFieldProps = ConstructorParameters<typeof DepthOfFieldEffect>[1] &
  Partial<{
    ref: Ref<DepthOfFieldEffect>
    target: ReactThreeFiber.Vector3
    depthTexture: {
      texture: Texture
      // TODO: narrow to DepthPackingStrategies
      packing: number
    }
    // TODO: not used
    blur: number
  }>

export function DepthOfField({
  ref,
  blendFunction,
  worldFocusDistance,
  worldFocusRange,
  focusDistance,
  focusRange,
  focalLength,
  bokehScale,
  resolutionScale,
  resolutionX,
  resolutionY,
  width,
  height,
  target,
  depthTexture,
  ...props
}: DepthOfFieldProps) {
  const { camera } = use(EffectComposerContext)
  const autoFocus = target != null

  const effect = useMemo(() => {
    const effect = new DepthOfFieldEffect(camera, {
      blendFunction,
      worldFocusDistance,
      worldFocusRange,
      focusDistance,
      focusRange,
      focalLength,
      bokehScale,
      resolutionScale,
      resolutionX,
      resolutionY,
      width,
      height,
    })
    // Creating a target enables autofocus, R3F will set via props
    if (autoFocus) effect.target = new Vector3()
    // Depth texture for depth picking with optional packing strategy
    if (depthTexture) effect.setDepthTexture(depthTexture.texture, depthTexture.packing as DepthPackingStrategies)
    // Temporary fix that restores DOF 6.21.3 behavior, everything since then lets shapes leak through the blur
    const maskPass = (effect as any).maskPass
    maskPass.maskFunction = MaskFunction.MULTIPLY_RGB_SET_ALPHA
    return effect
  }, [
    camera,
    blendFunction,
    worldFocusDistance,
    worldFocusRange,
    focusDistance,
    focusRange,
    focalLength,
    bokehScale,
    resolutionScale,
    resolutionX,
    resolutionY,
    width,
    height,
    autoFocus,
    depthTexture,
  ])

  useDispose(effect)

  return <primitive {...props} object={effect} ref={ref} target={target} />
}
