// From https://github.com/N8python/n8ao
// https://twitter.com/N8Programs/status/1660996748485984261

import { Ref, forwardRef, useLayoutEffect, useMemo } from 'react'
/* @ts-ignore */
import { N8AOPostPass } from 'n8ao'
import { useThree, ReactThreeFiber, applyProps } from '@react-three/fiber'

type N8AOProps = {
  aoRadius?: number
  distanceFalloff?: number
  intensity?: number
  quality?: 'performance' | 'low' | 'medium' | 'high' | 'ultra'
  aoSamples?: number
  denoiseSamples?: number
  denoiseRadius?: number
  color?: ReactThreeFiber.Color
}

export const N8AO = forwardRef<N8AOPostPass, N8AOProps>(
  (
    {
      quality,
      aoRadius = 5,
      aoSamples = 16,
      denoiseSamples = 4,
      denoiseRadius = 12,
      distanceFalloff = 1,
      intensity = 1,
      color,
    },
    ref: Ref<N8AOPostPass>
  ) => {
    const { camera, scene } = useThree()
    const effect = useMemo(() => new N8AOPostPass(scene, camera), [])
    useLayoutEffect(() => {
      applyProps(effect.configuration, {
        color,
        aoRadius,
        distanceFalloff,
        intensity,
        aoSamples,
        denoiseSamples,
        denoiseRadius,
      })
    }, [color, aoRadius, distanceFalloff, intensity, aoSamples, denoiseSamples, denoiseRadius])
    useLayoutEffect(() => {
      if (quality) effect.setQualityMode(quality.charAt(0).toUpperCase() + quality.slice(1))
    }, [quality])
    return <primitive ref={ref} object={effect} />
  }
)
