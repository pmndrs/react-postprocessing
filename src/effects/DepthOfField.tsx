import { DepthOfFieldEffect, MaskFunction } from 'postprocessing'
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
  const { camera } = useContext(EffectComposerContext)
  const effect = useMemo(() => {
    const effect = new DepthOfFieldEffect(camera, props)
    // Temporary fix that restores DOF 6.21.3 behavior, everything since then lets shapes leak through the blur
    const maskMaterial = (effect as any).maskPass.getFullscreenMaterial()
    maskMaterial.maskFunction = MaskFunction.MULTIPLY_RGB_SET_ALPHA
    return effect
  }, [])
  const depthTarget = useMemo(() => new Vector3(), [])
  useLayoutEffect(() => {
    invalidate()
  }, [camera, props])
  useLayoutEffect(() => {
    if (target) {
      if (typeof target === 'number') depthTarget.set(target, target, target)
      else if (target.isVector3) depthTarget.copy(target)
      else depthTarget.set(target[0], target[1], target[2])

      effect.target = depthTarget
    }
    if (depthTexture) effect.setDepthTexture(depthTexture.texture, depthTexture.packing as DepthPackingStrategies)
    invalidate()
  }, [target, depthTexture, effect])
  return <primitive ref={ref} object={effect} dispose={null} />
})
