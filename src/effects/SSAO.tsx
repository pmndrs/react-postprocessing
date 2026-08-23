import { BlendFunction, SSAOEffect } from 'postprocessing'
import { Ref, use, useMemo } from 'react'
import { EffectComposerContext } from '../EffectComposer'
import { applyPierced, readPierced, useDispose, useLiveDefaults } from '../util'

// first two args are camera and texture
type SSAOProps = ConstructorParameters<typeof SSAOEffect>[2] & { ref?: Ref<SSAOEffect> }

// Only resolutionScale/resolutionX/resolutionY/width/height and
// normalDepthBuffer have no live setter in postprocessing - everything else
// either has a real accessor directly on SSAOEffect, or on the nested
// ssaoMaterial (rangeThreshold/rangeFalloff are the constructor's names for
// what ssaoMaterial exposes as proximityThreshold/proximityFalloff).
// camera+normalBuffer being required constructor args also rule out
// createEffectComponent (needs `new Effect()` to work with zero args).
const LIVE_KEYS = [
  'blendMode-blendFunction',
  'normalBuffer',
  'samples',
  'rings',
  'radius',
  'depthAwareUpsampling',
  'color',
  'luminanceInfluence',
  'intensity',
  'ssaoMaterial-bias',
  'ssaoMaterial-fade',
  'ssaoMaterial-minRadiusScale',
  'ssaoMaterial-distanceThreshold',
  'ssaoMaterial-distanceFalloff',
  'ssaoMaterial-worldDistanceThreshold',
  'ssaoMaterial-worldDistanceFalloff',
  'rangeThreshold',
  'rangeFalloff',
  'ssaoMaterial-worldProximityThreshold',
  'ssaoMaterial-worldProximityFalloff',
]

function get(effect: SSAOEffect, key: string): unknown {
  if (key === 'rangeThreshold') return effect.ssaoMaterial.proximityThreshold
  if (key === 'rangeFalloff') return effect.ssaoMaterial.proximityFalloff
  return readPierced(effect, key)
}

function set(effect: SSAOEffect, key: string, value: unknown): void {
  if (key === 'rangeThreshold') effect.ssaoMaterial.proximityThreshold = value as number
  else if (key === 'rangeFalloff') effect.ssaoMaterial.proximityFalloff = value as number
  else applyPierced(effect, key, value)
}

export function SSAO({
  blendFunction = BlendFunction.MULTIPLY,
  samples = 30,
  rings = 4,
  distanceThreshold = 1.0,
  distanceFalloff = 0.0,
  rangeThreshold = 0.5,
  rangeFalloff = 0.1,
  luminanceInfluence = 0.9,
  radius = 20,
  bias = 0.5,
  intensity = 1.0,
  color,
  worldDistanceThreshold,
  worldDistanceFalloff,
  worldProximityThreshold,
  worldProximityFalloff,
  minRadiusScale,
  fade,
  depthAwareUpsampling = true,
  resolutionScale,
  resolutionX,
  resolutionY,
  width,
  height,
  ref,
}: SSAOProps) {
  const { camera, normalPass, downSamplingPass, resolutionScale: composerResolutionScale } = use(EffectComposerContext)

  const effect = useMemo<SSAOEffect | {}>(() => {
    if (normalPass === null && downSamplingPass === null) {
      console.error('Please enable the NormalPass in the EffectComposer in order to use SSAO.')
      return {}
    }

    return new SSAOEffect(camera, normalPass && !downSamplingPass ? (normalPass as any).texture : null, {
      blendFunction,
      samples,
      rings,
      distanceThreshold,
      distanceFalloff,
      rangeThreshold,
      rangeFalloff,
      luminanceInfluence,
      radius,
      bias,
      intensity,
      // @ts-ignore
      normalDepthBuffer: downSamplingPass ? downSamplingPass.texture : null,
      resolutionScale: resolutionScale ?? composerResolutionScale ?? 1,
      resolutionX,
      resolutionY,
      width,
      height,
      depthAwareUpsampling,
    })
    // color/worldDistanceThreshold/worldDistanceFalloff/worldProximityThreshold/
    // worldProximityFalloff/minRadiusScale/fade are deliberately left out here
    // even though they're valid constructor options: they have no JS-level
    // default in this component's own signature, so useLiveDefaults' first
    // snapshot must see SSAOEffect's own real default for them, not whatever
    // value happened to be passed on the mounting render - otherwise removing
    // the prop later "resets" to that first-render value instead of the
    // effect's true default. They're still applied immediately below, live.
    //
    // Only the genuinely construction-only options belong here - everything
    // else is applied live below via useLiveDefaults instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, downSamplingPass, normalPass, resolutionScale, composerResolutionScale, resolutionX, resolutionY, width, height])

  useLiveDefaults(
    effect instanceof SSAOEffect ? effect : null,
    {
      'blendMode-blendFunction': blendFunction,
      samples,
      rings,
      radius,
      depthAwareUpsampling,
      color,
      luminanceInfluence,
      intensity,
      'ssaoMaterial-bias': bias,
      'ssaoMaterial-fade': fade,
      'ssaoMaterial-minRadiusScale': minRadiusScale,
      'ssaoMaterial-distanceThreshold': distanceThreshold,
      'ssaoMaterial-distanceFalloff': distanceFalloff,
      'ssaoMaterial-worldDistanceThreshold': worldDistanceThreshold,
      'ssaoMaterial-worldDistanceFalloff': worldDistanceFalloff,
      rangeThreshold,
      rangeFalloff,
      'ssaoMaterial-worldProximityThreshold': worldProximityThreshold,
      'ssaoMaterial-worldProximityFalloff': worldProximityFalloff,
    },
    LIVE_KEYS,
    get,
    set
  )

  useDispose(effect as SSAOEffect)

  return <primitive ref={ref} object={effect} />
}
