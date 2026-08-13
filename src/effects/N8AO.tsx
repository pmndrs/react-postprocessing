// From https://github.com/N8python/n8ao
// https://twitter.com/N8Programs/status/1660996748485984261

import { ReactThreeFiber, applyProps, useThree } from '@react-three/fiber'
import { Ref, useLayoutEffect, useMemo } from 'react'
/* @ts-ignore */
import { N8AOPostPass } from 'n8ao'
import { groupPasses } from '../EffectComposer'
import { useDispose } from '../util'

export type N8AOProps = {
  enabled?: boolean
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
  ref?: Ref<N8AOPostPass>
}

export function N8AO({
  enabled = true,
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
  ref,
}: N8AOProps) {
  const { camera, scene, invalidate } = useThree()
  const effect = useMemo(() => {
    const instance = new N8AOPostPass(scene, camera)
    // N8AOPostPass isn't a postprocessing Effect, so it's not mergeable via
    // EffectGroup - it's already a standalone Pass, hence its own `enabled`
    // prop below instead. Registering it here still gets it the shared
    // trailing CopyPass safety net (see EffectComposer.tsx) so disabling it
    // while it's the last pass in the chain doesn't blank the canvas.
    groupPasses.add(instance)
    return instance
  }, [camera, scene])

  // TODO: implement dispose upstream; this effect has memory leaks without
  useDispose(effect)

  useLayoutEffect(() => {
    effect.enabled = enabled
    invalidate()
  }, [effect, enabled, invalidate])

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
    // effect.configuration is a plain object, never r3f-managed - applyProps'
    // own invalidate (gated behind object.__r3f) never fires for it.
    invalidate()
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
    invalidate,
  ])

  useLayoutEffect(() => {
    if (quality) {
      effect.setQualityMode(quality.charAt(0).toUpperCase() + quality.slice(1))
      invalidate()
    }
  }, [effect, quality, invalidate])

  return <primitive ref={ref} object={effect} />
}
