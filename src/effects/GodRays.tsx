import { useThree } from '@react-three/fiber'
import { GodRaysEffect } from 'postprocessing'
import { Ref, RefObject, use, useEffect, useLayoutEffect, useMemo } from 'react'
import { Mesh, Points } from 'three'
import { EffectComposerContext } from '../EffectComposer'
import { applyPierced, readPierced, resolveRef, useDispose, useLiveDefaults } from '../util'

type GodRaysProps = ConstructorParameters<typeof GodRaysEffect>[2] & {
  sun: Mesh | Points | RefObject<Mesh | Points>
  ref?: Ref<GodRaysEffect>
}

// GodRaysMaterial (godRaysMaterial) is where density/decay/weight/exposure
// actually live - clampMax maps to its differently-named maxIntensity.
// resolutionScale/resolutionX/resolutionY have no setter at all in
// postprocessing - construction-only. camera+sun being required constructor
// args also rule out createEffectComponent (needs `new Effect()` to work
// with zero args).
const LIVE_KEYS = [
  'blendMode-blendFunction',
  'godRaysMaterial-density',
  'godRaysMaterial-decay',
  'godRaysMaterial-weight',
  'godRaysMaterial-exposure',
  'clampMax',
  'blur',
  'kernelSize',
  'samples',
  'width',
  'height',
]

function get(effect: GodRaysEffect, key: string): unknown {
  return key === 'clampMax' ? effect.godRaysMaterial.maxIntensity : readPierced(effect, key)
}

function set(effect: GodRaysEffect, key: string, value: unknown): void {
  if (key === 'clampMax') effect.godRaysMaterial.maxIntensity = value as number
  else applyPierced(effect, key, value)
}

export function GodRays({
  sun,
  blendFunction,
  density,
  decay,
  weight,
  exposure,
  clampMax,
  blur,
  kernelSize,
  samples,
  width,
  height,
  resolutionScale,
  resolutionX,
  resolutionY,
  ref,
}: GodRaysProps) {
  const { camera, autoClear } = use(EffectComposerContext)
  const invalidate = useThree((state) => state.invalidate)

  const effect = useMemo(
    () => new GodRaysEffect(camera, resolveRef(sun), { resolutionScale, resolutionX, resolutionY }),
    [camera, resolutionScale, resolutionX, resolutionY]
  )

  useEffect(() => {
    if (autoClear !== false) {
      console.warn(
        'GodRays renders an internal extra pass that needs <EffectComposer autoClear={false}> - without it, occlusion by other objects will look wrong.'
      )
    }
  }, [autoClear])

  useLayoutEffect(() => {
    effect.lightSource = resolveRef(sun)
    invalidate()
  }, [effect, sun, invalidate])

  useLiveDefaults(
    effect,
    {
      'blendMode-blendFunction': blendFunction,
      'godRaysMaterial-density': density,
      'godRaysMaterial-decay': decay,
      'godRaysMaterial-weight': weight,
      'godRaysMaterial-exposure': exposure,
      clampMax,
      blur,
      kernelSize,
      samples,
      width,
      height,
    },
    LIVE_KEYS,
    get,
    set
  )

  useDispose(effect)

  return <primitive ref={ref} object={effect} />
}
