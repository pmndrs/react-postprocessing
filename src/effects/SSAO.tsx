import React, { Ref, forwardRef, useContext, useMemo } from 'react'
import { SSAOEffect, BlendFunction } from 'postprocessing'
import { EffectComposerContext } from '../EffectComposer'

// first two args are camera and texture
type SSAOProps = ConstructorParameters<typeof SSAOEffect>[2]

export const SSAO = forwardRef<SSAOEffect, SSAOProps>(function SSAO(props: SSAOProps, ref: Ref<SSAOEffect>) {
  const { camera, normalPass } = useContext(EffectComposerContext)
  const effect = useMemo(() => {
    if (normalPass === null) {
      console.error('Please enable the NormalPass in the EffectComposer in order to use SSAO.')
      return null
    }
    return new SSAOEffect(camera, normalPass.renderTarget.texture, {
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
    })
  }, [camera, normalPass, props])
  return <primitive ref={ref} object={effect} dispose={null} />
})
