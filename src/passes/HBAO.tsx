import { forwardRef, useContext, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { EffectComposer, EffectPass } from 'postprocessing'
// @ts-ignore
import { VelocityDepthNormalPass, HBAOEffect } from 'realism-effects'
import { EffectComposerContext } from '../EffectComposer'
import { useVelocityBuffer } from './useVelocityBuffer'

export interface HBAOOptions {
  // AO options
  resolutionScale: number
  spp: number
  distance: number
  distancePower: number
  power: number
  bias: number
  thickness: number
  color: THREE.Color
  useNormalPass: boolean
  velocityDepthNormalPass: VelocityDepthNormalPass | null
  normalTexture: THREE.Texture | null
  // Poisson blur options
  iterations: number
  radius: number
  rings: number
  lumaPhi: number
  depthPhi: number
  normalPhi: number
  samples: number
  // normalTexture: THREE.Texture | null
}

export class HBAOPass extends EffectPass {
  constructor(composer: EffectComposer, camera: THREE.Camera, scene: THREE.Scene, options?: Partial<HBAOOptions>) {
    super(camera, new HBAOEffect(composer, camera, scene, options))
  }
}

export interface HBAOProps extends Omit<Partial<HBAOOptions>, 'velocityDepthNormalPass'>, Partial<HBAOPass> {}

export const HBAO = forwardRef<HBAOPass, HBAOProps>(function HBAO(
  {
    // AO
    resolutionScale = 1,
    spp = 8,
    distance = 2,
    distancePower = 1,
    power = 2,
    bias = 40,
    thickness = 0.075,
    color = new THREE.Color('black'),
    useNormalPass = false,
    normalTexture = null,
    // Poisson
    iterations = 1,
    radius = 8,
    rings = 5.625,
    lumaPhi = 10,
    depthPhi = 2,
    normalPhi = 3.25,
    samples = 16,
    ...props
  },
  ref
) {
  const velocityDepthNormalPass = useVelocityBuffer()
  const { composer, camera, scene } = useContext(EffectComposerContext)
  const effect = useMemo(
    () =>
      new HBAOPass(composer, camera, scene, {
        resolutionScale,
        spp,
        distance,
        distancePower,
        power,
        bias,
        thickness,
        color,
        useNormalPass,
        velocityDepthNormalPass,
        normalTexture,
        iterations,
        radius,
        rings,
        lumaPhi,
        depthPhi,
        normalPhi,
        samples,
      }),
    [
      composer,
      camera,
      scene,
      resolutionScale,
      spp,
      distance,
      distancePower,
      power,
      bias,
      thickness,
      color,
      useNormalPass,
      velocityDepthNormalPass,
      normalTexture,
      iterations,
      radius,
      rings,
      lumaPhi,
      depthPhi,
      normalPhi,
      samples,
    ]
  )
  useEffect(() => {
    return () => {
      effect.dispose()
    }
  }, [effect])

  return <primitive {...props} ref={ref} object={effect} />
})
