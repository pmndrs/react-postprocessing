import type { ReactThreeFiber } from '@react-three/fiber'
import { ShockWaveEffect } from 'postprocessing'
import { Ref, use, useMemo } from 'react'
import { EffectComposerContext } from '../EffectComposer'
import { useDispose, useLiveDefaults, useVector3 } from '../util'

export type ShockWaveProps = {
  position?: ReactThreeFiber.Vector3
  speed?: number
  maxRadius?: number
  waveSize?: number
  amplitude?: number
  ref?: Ref<ShockWaveEffect>
}

const LIVE_KEYS = ['position', 'speed', 'maxRadius', 'waveSize', 'amplitude']

// ShockWaveEffect's constructor is (camera, position, options) - camera is
// a required arg, so it can't use createEffectComponent (needs
// `new Effect()` to work with zero args). Built by hand instead, like
// Outline/GodRays.
export function ShockWave(props: ShockWaveProps) {
  const { speed, maxRadius, waveSize, amplitude, ref } = props
  const { camera } = use(EffectComposerContext)
  const effect = useMemo(() => new ShockWaveEffect(camera), [camera])
  const position = useVector3(props, 'position')

  useLiveDefaults(effect, { position, speed, maxRadius, waveSize, amplitude }, LIVE_KEYS)
  useDispose(effect)

  return <primitive ref={ref} object={effect} />
}
