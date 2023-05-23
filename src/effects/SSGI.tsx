import * as THREE from 'three'
import { useMemo, useEffect, forwardRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Pass, EffectPass } from 'postprocessing'
// @ts-ignore
import { VelocityDepthNormalPass, SSGIEffect, TRAAEffect } from 'realism-effects'

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

class SSGIPass extends Pass {
  readonly velocityDepthNormalPass: VelocityDepthNormalPass
  readonly ssgiPass: EffectPass
  readonly traaPass: EffectPass

  constructor(scene: THREE.Scene, camera: THREE.Camera, options: SSGIOptions = {} as SSGIOptions) {
    super('SSGIPass', scene, camera)

    this.velocityDepthNormalPass = new VelocityDepthNormalPass(scene, camera)
    this.ssgiPass = new EffectPass(camera, new SSGIEffect(scene, camera, this.velocityDepthNormalPass, options))
    this.traaPass = new EffectPass(camera, new TRAAEffect(scene, camera, this.velocityDepthNormalPass))
  }

  initialize(renderer: THREE.WebGLRenderer, alpha: boolean, frameBufferType: number) {
    this.velocityDepthNormalPass.initialize(renderer, alpha, frameBufferType)
    this.ssgiPass.initialize(renderer, alpha, frameBufferType)
    this.traaPass.initialize(renderer, alpha, frameBufferType)
  }

  setSize(width: number, height: number): void {
    this.velocityDepthNormalPass.setSize(width, height)
    this.ssgiPass.setSize(width, height)
    this.traaPass.setSize(width, height)
  }

  render(
    renderer: THREE.WebGLRenderer,
    inputBuffer: THREE.WebGLRenderTarget | null,
    outputBuffer: THREE.WebGLRenderTarget | null,
    deltaTime?: number,
    stencilTest?: boolean
  ): void {
    this.velocityDepthNormalPass.render(renderer, outputBuffer, inputBuffer, deltaTime, stencilTest)
    this.ssgiPass.render(renderer, outputBuffer, inputBuffer, deltaTime, stencilTest)
    this.traaPass.renderToScreen = this.renderToScreen
    this.traaPass.render(renderer, inputBuffer, outputBuffer, deltaTime, stencilTest)
  }
}

export interface SSGIProps extends SSGIOptions {}

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
  const { scene, camera } = useThree()
  const effect = useMemo(
    () =>
      new SSGIPass(scene, camera, {
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
