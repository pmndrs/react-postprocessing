// From https://github.com/N8python/n8ao
// https://twitter.com/N8Programs/status/1660996748485984261

import { Ref, forwardRef, useLayoutEffect, useMemo } from 'react'
/* @ts-ignore */
import { N8AOPostPass } from 'n8ao'
import { useThree, ReactThreeFiber, applyProps } from '@react-three/fiber'

export type N8AOProps = {
  aoRadius?: number
  distanceFalloff?: number
  intensity?: number
  quality?: 'performance' | 'low' | 'medium' | 'high' | 'ultra'
  aoSamples?: number
  denoiseSamples?: number
  denoiseRadius?: number
  color?: ReactThreeFiber.Color
  halfRes?: boolean
  depthAwareUpsampling?: boolean
  screenSpaceRadius?: boolean
  renderMode?: 0 | 1 | 2 | 3 | 4
}

export const N8AO = /* @__PURE__ */ forwardRef<N8AOPostPass, N8AOProps>(
  (
    {
      halfRes,
      screenSpaceRadius,
      quality,
      depthAwareUpsampling = true,
      aoRadius = 5,
      aoSamples = 16,
      denoiseSamples = 4,
      denoiseRadius = 12,
      distanceFalloff = 1,
      intensity = 1,
      color,
      renderMode = 0,
    },
    ref: Ref<N8AOPostPass>
  ) => {
    const { camera, scene } = useThree()
    const effect = useMemo(() => new N8AOPostPass(scene, camera), [camera, scene])

    // TODO: implement dispose upstream; this effect has memory leaks without
    useLayoutEffect(() => {
      applyProps(effect.configuration, {
        color,
        aoRadius,
        distanceFalloff,
        intensity,
        aoSamples,
        denoiseSamples,
        denoiseRadius,
        screenSpaceRadius,
        renderMode,
        halfRes,
        depthAwareUpsampling,
      })
    }, [
      screenSpaceRadius,
      color,
      aoRadius,
      distanceFalloff,
      intensity,
      aoSamples,
      denoiseSamples,
      denoiseRadius,
      renderMode,
      halfRes,
      depthAwareUpsampling,
      effect,
    ])

    useLayoutEffect(() => {
      if (quality) effect.setQualityMode(quality.charAt(0).toUpperCase() + quality.slice(1))
    }, [effect, quality])

    return <primitive ref={ref} object={effect} />
  }
)
