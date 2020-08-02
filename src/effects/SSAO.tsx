import React, { Ref, ForwardRefExoticComponent, forwardRef, useContext, useMemo } from 'react'
import { useThree } from 'react-three-fiber'
import { SSAOEffect, BlendFunction } from 'postprocessing'
import { EffectComposerContext } from '../EffectComposer'

// first two args are camera and texture
type SSAOProps = ConstructorParameters<typeof SSAOEffect>[2]

export const SSAO: ForwardRefExoticComponent<SSAOEffect> = forwardRef(function SSAO(
  props: SSAOProps,
  ref: Ref<SSAOEffect>
) {
  const { camera } = useThree()
  const { normalPass } = useContext(EffectComposerContext)
  const effect = useMemo(
    () =>
      new SSAOEffect(camera, normalPass.renderTarget.texture, {
        blendFunction: BlendFunction.MULTIPLY,
        samples: 30,
        rings: 4,
        distanceThreshold: 1.0,
        distanceFalloff: 0.0,
        rangeThreshold: 0.5,
        rangeFalloff: 0.1,
        luminanceInfluence: 0.9,
        radius: 20,
        scale: 0.5,
        bias: 0.5,
        ...props,
      }),
    [props]
  )
  return <primitive ref={ref} object={effect} dispose={null} />
})
