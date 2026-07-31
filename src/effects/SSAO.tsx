import { BlendFunction, SSAOEffect } from 'postprocessing'
import { Ref, useContext, useMemo } from 'react'
import { EffectComposerContext } from '../EffectComposer'
import { useDispose } from '../util'

// first two args are camera and texture
type SSAOProps = ConstructorParameters<typeof SSAOEffect>[2] & { ref?: Ref<SSAOEffect> }

export function SSAO({ ref, ...props }: SSAOProps) {
  const { camera, normalPass, downSamplingPass, resolutionScale } = useContext(EffectComposerContext)

  const effect = useMemo<SSAOEffect | {}>(() => {
    if (normalPass === null && downSamplingPass === null) {
      console.error('Please enable the NormalPass in the EffectComposer in order to use SSAO.')
      return {}
    }

    return new SSAOEffect(camera, normalPass && !downSamplingPass ? (normalPass as any).texture : null, {
      blendFunction: BlendFunction.MULTIPLY,
      samples: 30,
      rings: 4,
      distanceThreshold: 1.0,
      distanceFalloff: 0.0,
      rangeThreshold: 0.5,
      rangeFalloff: 0.1,
      luminanceInfluence: 0.9,
      radius: 20,
      bias: 0.5,
      intensity: 1.0,
      color: undefined,
      // @ts-ignore
      normalDepthBuffer: downSamplingPass ? downSamplingPass.texture : null,
      resolutionScale: resolutionScale ?? 1,
      depthAwareUpsampling: true,
      ...props,
    })
    // NOTE: `props` is an unstable reference, so we can't memoize it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, downSamplingPass, normalPass, resolutionScale])

  useDispose(effect)

  return <primitive ref={ref} object={effect} />
}
