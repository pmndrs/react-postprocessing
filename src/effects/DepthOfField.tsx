import type { ReactThreeFiber } from '@react-three/fiber'
import { DepthOfFieldEffect, MaskFunction } from 'postprocessing'
import type { Ref } from 'react'
import { use, useMemo } from 'react'
import { type DepthPackingStrategies, type Texture, Vector3 } from 'three'
import { EffectComposerContext } from '../EffectComposer'
import { applyPierced, readPierced, useDispose, useLiveDefaults } from '../util'

export type DepthOfFieldProps = ConstructorParameters<typeof DepthOfFieldEffect>[1] &
  Partial<{
    ref: Ref<DepthOfFieldEffect>
    target: ReactThreeFiber.Vector3
    depthTexture: {
      texture: Texture
      // TODO: narrow to DepthPackingStrategies
      packing: number
    }
    // TODO: not used
    blur: number
  }>

// Only bokehScale, focusDistance/focusRange (via the nested cocMaterial),
// depthTexture (via setDepthTexture) and blendFunction have real setters in
// postprocessing - every resolution option is construction-only. camera
// being a required constructor arg also rules out createEffectComponent
// (needs `new Effect()` to work with zero args).
const LIVE_KEYS = [
  'blendMode-blendFunction',
  'bokehScale',
  'cocMaterial-focusDistance',
  'cocMaterial-focusRange',
  'depthTexture',
]

// cocMaterial.depthBuffer/depthPacking are write-only in postprocessing
// (setters with no matching getters) - depthPacking can't be read back at
// all, so a reverted default always re-applies BasicDepthPacking (the same
// value setDepthTexture itself defaults to when packing is omitted).
function get(effect: DepthOfFieldEffect, key: string): unknown {
  if (key !== 'depthTexture') return readPierced(effect, key)
  const texture = (effect.cocMaterial as unknown as { uniforms: { depthBuffer: { value: unknown } } }).uniforms
    .depthBuffer.value
  return texture ? { texture } : undefined
}

function set(effect: DepthOfFieldEffect, key: string, value: unknown): void {
  if (key === 'depthTexture') {
    const dt = value as { texture?: Texture; packing?: DepthPackingStrategies } | undefined
    effect.setDepthTexture(dt?.texture as never, dt?.packing)
  } else applyPierced(effect, key, value)
}

export function DepthOfField({
  ref,
  blendFunction,
  worldFocusDistance,
  worldFocusRange,
  focusDistance,
  focusRange,
  focalLength,
  bokehScale,
  resolutionScale,
  resolutionX,
  resolutionY,
  width,
  height,
  target,
  depthTexture,
  ...props
}: DepthOfFieldProps) {
  const { camera } = use(EffectComposerContext)
  const autoFocus = target != null

  const effect = useMemo(() => {
    const effect = new DepthOfFieldEffect(camera, {
      worldFocusDistance,
      worldFocusRange,
      focalLength,
      resolutionScale,
      resolutionX,
      resolutionY,
      width,
      height,
    })
    // Creating a target enables autofocus, R3F will set via props
    if (autoFocus) effect.target = new Vector3()
    // Temporary fix that restores DOF 6.21.3 behavior, everything since then lets shapes leak through the blur
    effect.maskFunction = MaskFunction.MULTIPLY_RGB_SET_ALPHA
    return effect
  }, [camera, worldFocusDistance, worldFocusRange, focalLength, resolutionScale, resolutionX, resolutionY, width, height, autoFocus])

  useLiveDefaults(
    effect,
    {
      'blendMode-blendFunction': blendFunction,
      bokehScale,
      'cocMaterial-focusDistance': focusDistance,
      'cocMaterial-focusRange': focusRange,
      depthTexture,
    },
    LIVE_KEYS,
    get,
    set
  )

  useDispose(effect)

  return <primitive {...props} object={effect} ref={ref} target={target} />
}
