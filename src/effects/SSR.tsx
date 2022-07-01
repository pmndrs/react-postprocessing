import React, { Ref, forwardRef, useState, useEffect, useContext, useMemo, useLayoutEffect } from 'react'
/* @ts-ignore */
import { KernelSize } from 'postprocessing'
/* @ts-ignore */
import { SSRPass } from 'screen-space-reflections'
import { EffectComposerContext } from '../EffectComposer'
import { useThree } from '@react-three/fiber'

// first two args are camera and texture
type SSRProps = {
  /** Size of the blur buffer */
  blurSize: number
  /** Whether to blur the reflections and blend these blurred reflections depending on the roughness and depth of the reflection ray */
  useBlur: boolean
  /** The kernel size of the blur pass which is used to blur reflections; higher kernel sizes will result in blurrier reflections with more artifacts */
  blurKernelSize: number
  /** How much the reflection ray should travel in each of its iteration; higher values will give deeper reflections but with more artifacts */
  rayStep: number
  /** The intensity of the reflections */
  intensity: number
  /** The power by which the reflections should be potentiated; higher values will give a more intense and vibrant look */
  power: number
  /** How much deep reflections will be blurred (as reflections become blurrier the further away the object they are reflecting is) */
  depthBlur: number
  /** Whether jittering is enabled; jittering will randomly jitter the reflections resulting in a more noisy but overall more realistic look, enabling jittering can be expensive depending on the view angle */
  enableJittering: boolean
  /** How intense jittering should be */
  jitter: number
  /** How much the jittered rays should be spread; higher values will give a rougher look regarding the reflections but are more expensive to compute with */
  jitterSpread: number
  /** Roughness fade out */
  roughnessFadeOut: number
  /** The number of steps a reflection ray can maximally do to find an object it intersected (and thus reflects) */
  MAX_STEPS: number
  /** Once we had our ray intersect something, we need to find the exact point in space it intersected and thus it reflects; this can be done through binary search with the given number of maximum steps */
  NUM_BINARY_SEARCH_STEPS: number
  /** The maximum depth difference between a ray and the particular depth at its screen position after refining with binary search; lower values will result in better performance */
  maxDepthDifference: number
  /** The maximum depth for which reflections will be calculated */
  maxDepth: number
  /** The maximum depth difference between a ray and the particular depth at its screen position before refining with binary search; lower values will result in better performance */
  thickness: number
  /** Index of Refraction, used for calculating fresnel; reflections tend to be more intense the steeper the angle between them and the viewer is, the ior parameter set how much the intensity varies */
  ior: number
  /** WebGL2 only - whether to use multiple render targets when rendering the G-buffers (normals, depth and roughness); using them can improve performance as they will render all information to multiple buffers for each fragment in one run */
  useMRT: boolean
  /**  If normal maps should be taken account of when calculating reflections */
  useNormalMap: boolean
  /** If roughness maps should be taken account of when calculating reflections */
  useRoughnessMap: boolean
}

export const SSR = forwardRef<SSRPass, SSRProps>(function SSR(
  { blurSize = 512, ...props }: SSRProps,
  ref: Ref<SSRPass>
) {
  const { size, viewport, invalidate } = useThree()
  const { composer, scene, camera } = useContext(EffectComposerContext)

  const [options] = useState({
    width: size.width,
    height: size.height,
    blurWidth: blurSize,
    blurHeight: blurSize,
    blurKernelSize: KernelSize.SMALL,
    rayStep: 0.1,
    intensity: 1,
    power: 1,
    depthBlur: 0.1,
    enableJittering: false,
    jitter: 0.1,
    jitterSpread: 0.1,
    roughnessFadeOut: 1,
    MAX_STEPS: 20,
    NUM_BINARY_SEARCH_STEPS: 5,
    maxDepthDifference: 1,
    maxDepth: 1,
    thickness: 10,
    ior: 1.45,
    useBlur: true,
    useMRT: true,
    useNormalMap: true,
    useRoughnessMap: true,
    ...props,
  })

  const [pass] = useState(() => new SSRPass(composer, scene, camera, options))

  useEffect(() => {
    Object.keys(props).forEach(
      (key) => pass.reflectionUniforms[key] && (pass.reflectionUniforms[key].value = props[key])
    )
  }, [props])

  useEffect(() => {
    if (props.useBlur) {
      pass.fullscreenMaterial.defines.USE_BLUR = ''
      pass.reflectionsPass.fullscreenMaterial.defines.USE_BLUR = ''
    } else {
      delete pass.fullscreenMaterial.defines.USE_BLUR
      delete pass.reflectionsPass.fullscreenMaterial.defines.USE_BLUR
    }
    if (props.enableJittering) {
      pass.reflectionsPass.fullscreenMaterial.defines.USE_JITTERING = ''
    } else {
      delete pass.reflectionsPass.fullscreenMaterial.defines.USE_JITTERING
    }
    pass.reflectionsPass.fullscreenMaterial.defines.MAX_STEPS = props.MAX_STEPS
    pass.reflectionsPass.fullscreenMaterial.defines.NUM_BINARY_SEARCH_STEPS = props.NUM_BINARY_SEARCH_STEPS
    pass.reflectionsPass.fullscreenMaterial.needsUpdate = true
  }, [props.useBlur, props.enableJittering, props.NUM_BINARY_SEARCH_STEPS, props.MAX_STEPS])

  useEffect(() => {
    pass.setSize(size.width * viewport.dpr, size.height * viewport.dpr)
    pass.kawaseBlurPass.setSize(blurSize, blurSize)
    invalidate()
  }, [blurSize, size, viewport, composer, pass, invalidate])

  useLayoutEffect(() => {
    composer.addPass(pass)
    return () => {
      composer.removePass(pass)
    }
  }, [composer, pass])

  return null
})
