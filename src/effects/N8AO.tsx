// From https://github.com/N8python/n8ao
// https://twitter.com/N8Programs/status/1660996748485984261

import { Ref, forwardRef, useLayoutEffect, useMemo } from 'react'
/* @ts-ignore */
import { N8AOPostPass } from 'n8ao'
import { useThree } from '@react-three/fiber'

type N8AOProps = {
  aoRadius?: number
  distanceFalloff?: number
  intensity?: number
  quality?: 'performance' | 'low' | 'medium' | 'high' | 'ultra'
  aoSamples?: number
  denoiseSamples?: number
  denoiseRadius?: number
}

export const N8AO = forwardRef<N8AOPostPass, N8AOProps>(
  (
    { quality, aoRadius, aoSamples, denoiseSamples, denoiseRadius, distanceFalloff, intensity },
    ref: Ref<N8AOPostPass>
  ) => {
    const { camera, scene } = useThree()
    const effect = useMemo(() => new N8AOPostPass(scene, camera), [])
    useLayoutEffect(() => {
      Object.assign(effect.configuration, {
        aoRadius,
        distanceFalloff,
        intensity,
        aoSamples,
        denoiseSamples,
        denoiseRadius,
      })
    }, [aoRadius, distanceFalloff, intensity, aoSamples, denoiseSamples, denoiseRadius])
    useLayoutEffect(() => {
      if (quality) effect.setQualityMode(quality.charAt(0).toUpperCase() + quality.slice(1))
    }, [quality])
    return <primitive ref={ref} object={effect} />
  }
)
