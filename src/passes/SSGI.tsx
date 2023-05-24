import * as THREE from 'three'
import { useMemo, useEffect, forwardRef, useContext } from 'react'
import { EffectPass } from 'postprocessing'
// @ts-ignore
import { SSGIEffect } from 'realism-effects'
import { EffectComposerContext } from '../EffectComposer'
import { VelocityBuffer, useVelocityBuffer } from './useVelocityBuffer'

export interface SSGIOptions {
  distance: number
  thickness: number
  autoThickness: boolean
  maxRoughness: number
  blend: number
  denoiseIterations: number
  denoiseKernel: number
  denoiseDiffuse: number
  denoiseSpecular: number
  depthPhi: number
  normalPhi: number
  roughnessPhi: number
  envBlur: number
  importanceSampling: boolean
  directLightMultiplier: number
  steps: number
  refineSteps: number
  spp: number
  resolutionScale: number
  missedRays: boolean
}

export class SSGIPass extends EffectPass {
  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    velocityBuffer: VelocityBuffer,
    options?: Partial<SSGIOptions>
  ) {
    super(camera, new SSGIEffect(scene, camera, velocityBuffer, options))
  }
}

export interface SSGIProps extends Partial<SSGIOptions>, Partial<SSGIPass> {}

export const SSGI = forwardRef<SSGIPass, SSGIOptions>(function SSGI(
  {
    distance = 10,
    thickness = 10,
    autoThickness = false,
    maxRoughness = 1,
    blend = 0.9,
    denoiseIterations = 1,
    denoiseKernel = 2,
    denoiseDiffuse = 10,
    denoiseSpecular = 10,
    depthPhi = 2,
    normalPhi = 50,
    roughnessPhi = 1,
    envBlur = 0.5,
    importanceSampling = true,
    directLightMultiplier = 1,
    steps = 20,
    refineSteps = 5,
    spp = 1,
    resolutionScale = 1,
    missedRays = false,
    ...props
  },
  ref
) {
  const velocityBuffer = useVelocityBuffer()
  const { scene, camera } = useContext(EffectComposerContext)
  const effect = useMemo(
    () =>
      new SSGIPass(scene, camera, velocityBuffer, {
        distance,
        thickness,
        autoThickness,
        maxRoughness,
        blend,
        denoiseIterations,
        denoiseKernel,
        denoiseDiffuse,
        denoiseSpecular,
        depthPhi,
        normalPhi,
        roughnessPhi,
        envBlur,
        importanceSampling,
        directLightMultiplier,
        steps,
        refineSteps,
        spp,
        resolutionScale,
        missedRays,
      }),
    [
      scene,
      camera,
      velocityBuffer,
      distance,
      thickness,
      autoThickness,
      maxRoughness,
      blend,
      denoiseIterations,
      denoiseKernel,
      denoiseDiffuse,
      denoiseSpecular,
      depthPhi,
      normalPhi,
      roughnessPhi,
      envBlur,
      importanceSampling,
      directLightMultiplier,
      steps,
      refineSteps,
      spp,
      resolutionScale,
      missedRays,
    ]
  )

  useEffect(() => {
    return () => effect.dispose()
  }, [effect])

  return <primitive {...props} ref={ref} object={effect} />
})
