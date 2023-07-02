import React, { Ref, forwardRef, useLayoutEffect, useEffect, useContext, useMemo } from 'react'
/* @ts-ignore */
import { SSREffect } from './screen-space-reflections'
import { EffectComposerContext } from '../../EffectComposer'
import { selectionContext } from '../../Selection'
import { useThree } from '@react-three/fiber'

// first two args are camera and texture
type SSRProps = {
  /** whether you want to use Temporal Resolving to re-use reflections from the last frames; this will reduce noise tremendously but may result in "smearing" */
  temporalResolve?: boolean
  /** a value between 0 and 1 to set how much the last frame's reflections should be blended in; higher values will result in less noisy reflections when moving the camera but a more smeary look */
  temporalResolveMix?: number
  /** a value between 0 and 1 to set how much the reprojected reflection should be corrected; higher values will reduce smearing but will result in less flickering at reflection edges */
  temporalResolveCorrectionMix?: number
  /** the maximum number of samples for reflections; settings it to 0 means unlimited samples; setting it to a value like 6 can help make camera movements less disruptive when calculating reflections */
  maxSamples?: number
  /** whether to blur the reflections and blend these blurred reflections with the raw ones depending on the blurMix value */
  ENABLE_BLUR?: boolean
  /** how much the blurred reflections should be mixed with the raw reflections */
  blurMix?: number
  /** the sharpness of the Bilateral Filter used to blur reflections */
  blurSharpness?: number
  /** the kernel size of the Bilateral Blur Filter; higher kernel sizes will result in blurrier reflections with more artifacts */
  blurKernelSize?: number
  /** how much the reflection ray should travel in each of its iteration; higher values will give deeper reflections but with more artifacts */
  rayStep?: number
  /** the intensity of the reflections */
  intensity?: number
  /** the maximum roughness a texel can have to have reflections calculated for it */
  maxRoughness?: number
  /** whether jittering is enabled; jittering will randomly jitter the reflections resulting in a more noisy but overall more realistic look, enabling jittering can be expensive depending on the view angle */
  ENABLE_JITTERING?: boolean
  /** how intense jittering should be */
  jitter?: number
  /** how much the jittered rays should be spread; higher values will give a rougher look regarding the reflections but are more expensive to compute with */
  jitterSpread?: number
  /** how intense jittering should be in relation to a material's roughness */
  jitterRough?: number
  /** the number of steps a reflection ray can maximally do to find an object it intersected (and thus reflects) */
  MAX_STEPS?: number
  /** once we had our ray intersect something, we need to find the exact point in space it intersected and thus it reflects; this can be done through binary search with the given number of maximum steps */
  NUM_BINARY_SEARCH_STEPS?: number
  /** the maximum depth difference between a ray and the particular depth at its screen position after refining with binary search; lower values will result in better performance */
  maxDepthDifference?: number
  /** the maximum depth for which reflections will be calculated */
  maxDepth?: number
  /** the maximum depth difference between a ray and the particular depth at its screen position before refining with binary search; lower values will result in better performance */
  thickness?: number
  /** Index of Refraction, used for calculating fresnel; reflections tend to be more intense the steeper the angle between them and the viewer is, the ior parameter set how much the intensity varies */
  ior?: number
  /** if there should still be reflections for rays for which a reflecting point couldn't be found; enabling this will result in stretched looking reflections which can look good or bad depending on the angle */
  STRETCH_MISSED_RAYS?: boolean
  /** WebGL2 only - whether to use multiple render targets when rendering the G-buffers (normals, depth and roughness); using them can improve performance as they will render all information to multiple buffers for each fragment in one run; this setting can't be changed during run-time */
  USE_MRT?: boolean
  /** if roughness maps should be taken account of when calculating reflections */
  USE_ROUGHNESSMAP?: boolean
  /** if normal maps should be taken account of when calculating reflections */
  USE_NORMALMAP?: boolean
}

export const SSR = forwardRef<SSREffect, SSRProps>(function SSR(
  { ENABLE_BLUR = true, USE_MRT = true, ...props }: SSRProps,

  ref: Ref<SSREffect>
) {
  const { invalidate } = useThree()
  const { scene, camera } = useContext(EffectComposerContext)
  const effect = useMemo(
    () => new SSREffect(scene, camera, { ENABLE_BLUR, USE_MRT, ...props }),
    [scene, camera, ENABLE_BLUR, USE_MRT, props]
  )

  const api = useContext(selectionContext)
  useEffect(() => {
    if (api && api.enabled) {
      if (api.selected?.length) {
        effect.selection.set(api.selected)
        invalidate()
        return () => {
          effect.selection.clear()
          invalidate()
        }
      }
    }
  }, [api])

  return <primitive ref={ref} object={effect} {...props} />
})
