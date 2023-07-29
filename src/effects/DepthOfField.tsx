import { BlendFunction, DepthOfFieldEffect, MaskFunction, Resolution } from 'postprocessing'
import { Ref, forwardRef, useMemo, useLayoutEffect, useContext } from 'react'
import { ReactThreeFiber, useThree } from '@react-three/fiber'
import { type DepthPackingStrategies, type Texture, Vector3 } from 'three'
import { EffectComposerContext } from '../EffectComposer'

type DOFProps = ConstructorParameters<typeof DepthOfFieldEffect>[1] &
  Partial<{
    target: ReactThreeFiber.Vector3
    depthTexture: {
      texture: Texture
      packing: number
    }
    blur: number
  }>

export const DepthOfField = forwardRef(function DepthOfField(
  { target, depthTexture, ...props }: DOFProps,
  ref: Ref<DepthOfFieldEffect>
) {
  const invalidate = useThree((state) => state.invalidate)
  const { camera, scene } = useContext(EffectComposerContext)
  const effect = useMemo(() => {
    const effect = new DepthOfFieldEffect(camera, props)
    // Temporary fix that restores DOF 6.21.3 behavior, everything since then lets shapes leak through the blur
    const maskMaterial = (effect as any).maskPass.getFullscreenMaterial()
    maskMaterial.maskFunction = MaskFunction.MULTIPLY_RGB_SET_ALPHA
    return effect
  }, [])

  useLayoutEffect(() => {
    return () => {
      const depthEffect = effect as any
      depthEffect.blurPass.renderTargetA.dispose()
      depthEffect.blurPass.renderTargetB.dispose()
      depthEffect.maskPass.dispose()
      depthEffect.cocPass.dispose()
      depthEffect.renderTarget.dispose()
      depthEffect.renderTargetCoC.dispose()
      depthEffect.renderTargetCoCBlurred.dispose()
      depthEffect.renderTargetMasked.dispose()
      depthEffect.renderTargetNear.dispose()
      depthEffect.renderTargetFar.dispose()
    }
  }, [])

  useLayoutEffect(() => {
    effect.mainScene = scene
    effect.mainCamera = camera
    invalidate()
  }, [camera, scene])

  useLayoutEffect(() => {
    effect.bokehScale = props.bokehScale ?? 1.0
    effect.resolution.width = props.resolutionX ?? props.width ?? Resolution.AUTO_SIZE
    effect.resolution.height = props.resolutionY ?? props.height ?? Resolution.AUTO_SIZE
    effect.resolution.scale = props.resolutionScale ?? 1.0
    effect.blendMode.blendFunction = props.blendFunction ?? BlendFunction.NORMAL
    invalidate()
  }, [
    props.blur,
    props.width,
    props.height,
    props.blendFunction,
    props.bokehScale,
    props.resolutionScale,
    props.resolutionX,
    props.resolutionY,
  ])

  useLayoutEffect(() => {
    effect.circleOfConfusionMaterial.focusDistance = props.focusDistance ?? 0.0
    effect.circleOfConfusionMaterial.focalLength = props.focalLength ?? 0.1
    effect.circleOfConfusionMaterial.focusRange = props.focusRange ?? 0.1
    invalidate()
  }, [props.focusDistance, props.focusRange, props.focalLength])

  useLayoutEffect(() => {
    effect.circleOfConfusionMaterial.worldFocusDistance = props.worldFocusDistance ?? 0.0
    effect.circleOfConfusionMaterial.worldFocusRange = props.worldFocusRange ?? 0.1
    invalidate()
  }, [props.worldFocusDistance, props.worldFocusRange])
  useLayoutEffect(() => {
    if (target) {
      const depthTarget = new Vector3()
      if (typeof target === 'number') depthTarget.set(target, target, target)
      //@ts-ignore
      else if (target.isVector3) depthTarget.copy(target)
      //@ts-ignore
      else depthTarget.set(target[0], target[1], target[2])

      effect.target = depthTarget
    } else {
      //@ts-ignore
      effect.target = null
    }
    if (depthTexture) effect.setDepthTexture(depthTexture.texture, depthTexture.packing as DepthPackingStrategies)
    invalidate()
  }, [target, depthTexture, effect])
  return <primitive ref={ref} object={effect} dispose={null} />
})
