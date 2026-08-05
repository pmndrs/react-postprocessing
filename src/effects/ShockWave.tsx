import { BlendFunction, ShockWaveEffect } from 'postprocessing'
import { Ref, use, useMemo } from 'react'
import { Vector3 } from 'three'
import { EffectComposerContext } from '../EffectComposer'
import { useDispose, useLiveDefaults } from '../util'

export type ShockWaveProps = {
  position?: Vector3
  speed?: number
  maxRadius?: number
  waveSize?: number
  amplitude?: number
  blendFunction?: BlendFunction
  opacity?: number
  ref?: Ref<ShockWaveEffect>
}

const LIVE_KEYS = ['position', 'speed', 'maxRadius', 'waveSize', 'amplitude', 'blendMode-blendFunction', 'blendMode-opacity-value']

// ShockWaveEffect's constructor is (camera, position, options) - camera is
// a required arg, so it can't use createEffectComponent (needs
// `new Effect()` to work with zero args). Built by hand instead, like
// Outline/GodRays.
export function ShockWave({ position, speed, maxRadius, waveSize, amplitude, blendFunction, opacity, ref }: ShockWaveProps) {
  const { camera } = use(EffectComposerContext)
  const effect = useMemo(() => new ShockWaveEffect(camera), [camera])

  useLiveDefaults(effect, { position, speed, maxRadius, waveSize, amplitude, 'blendMode-blendFunction': blendFunction, 'blendMode-opacity-value': opacity }, LIVE_KEYS)
  useDispose(effect)

  return <primitive ref={ref} object={effect} />
}
