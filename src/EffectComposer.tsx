import type { TextureDataType } from 'three'
import { HalfFloatType } from 'three'
import React, {
  forwardRef,
  useMemo,
  useEffect,
  useLayoutEffect,
  createContext,
  useRef,
  useImperativeHandle,
} from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import {
  EffectComposer as EffectComposerImpl,
  RenderPass,
  EffectPass,
  NormalPass,
  // @ts-ignore
  DepthDownsamplingPass,
} from 'postprocessing'
import { isWebGL2Available } from 'three-stdlib'

export const EffectComposerContext = createContext<{
  composer: EffectComposerImpl
  normalPass: NormalPass | null
  downSamplingPass: DepthDownsamplingPass | null
  camera: THREE.Camera
  scene: THREE.Scene
  resolutionScale?: number
}>(null)

export type EffectComposerProps = {
  enabled?: boolean
  children: JSX.Element | JSX.Element[]
  depthBuffer?: boolean
  disableNormalPass?: boolean
  stencilBuffer?: boolean
  autoClear?: boolean
  resolutionScale?: number
  multisampling?: number
  frameBufferType?: TextureDataType
  renderPriority?: number
  camera?: THREE.Camera
  scene?: THREE.Scene
}

export const EffectComposer = React.memo(
  forwardRef(
    (
      {
        children,
        camera,
        scene,
        resolutionScale,
        enabled = true,
        renderPriority = 1,
        autoClear = true,
        depthBuffer,
        disableNormalPass,
        stencilBuffer,
        multisampling = 8,
        frameBufferType = HalfFloatType,
      }: EffectComposerProps,
      ref
    ) => {
      const { gl, scene: defaultScene, camera: defaultCamera, size } = useThree()
      scene = scene || defaultScene
      camera = camera || defaultCamera

      const [composer, normalPass, downSamplingPass] = useMemo(() => {
        const webGL2Available = isWebGL2Available()
        // Initialize composer
        const effectComposer = new EffectComposerImpl(gl, {
          depthBuffer,
          stencilBuffer,
          multisampling: multisampling > 0 && webGL2Available ? multisampling : 0,
          frameBufferType,
        })

        // Add render pass
        effectComposer.addPass(new RenderPass(scene, camera))

        // Create normal pass
        let downSamplingPass = null
        let normalPass = null
        if (!disableNormalPass) {
          normalPass = new NormalPass(scene, camera)
          normalPass.enabled = false
          effectComposer.addPass(normalPass)
          if (resolutionScale !== undefined && webGL2Available) {
            downSamplingPass = new DepthDownsamplingPass({ normalBuffer: normalPass.texture, resolutionScale })
            downSamplingPass.enabled = false
            effectComposer.addPass(downSamplingPass)
          }
        }

        return [effectComposer, normalPass, downSamplingPass]
      }, [
        camera,
        gl,
        depthBuffer,
        stencilBuffer,
        multisampling,
        frameBufferType,
        scene,
        disableNormalPass,
        resolutionScale,
      ])

      useEffect(() => composer?.setSize(size.width, size.height), [composer, size])
      useFrame(
        (_, delta) => {
          if (enabled) {
            gl.autoClear = autoClear
            composer.render(delta)
          }
        },
        enabled ? renderPriority : 0
      )

      const group = useRef(null)
      useLayoutEffect(() => {
        let effectPass
        if (group.current && group.current.__r3f && composer) {
          effectPass = new EffectPass(camera, ...(group.current as any).__r3f.objects)
          effectPass.renderToScreen = true
          composer.addPass(effectPass)
          if (normalPass) normalPass.enabled = true
          if (downSamplingPass) downSamplingPass.enabled = true
        }
        return () => {
          if (effectPass) composer?.removePass(effectPass)
          if (normalPass) normalPass.enabled = false
          if (downSamplingPass) downSamplingPass.enabled = false
        }
      }, [composer, children, camera, normalPass, downSamplingPass])

      // Memoize state, otherwise it would trigger all consumers on every render
      const state = useMemo(
        () => ({ composer, normalPass, downSamplingPass, resolutionScale, camera, scene }),
        [composer, normalPass, downSamplingPass, resolutionScale, camera, scene]
      )

      // Expose the composer
      useImperativeHandle(ref, () => composer, [composer])

      return (
        <EffectComposerContext.Provider value={state}>
          <group ref={group}>{children}</group>
        </EffectComposerContext.Provider>
      )
    }
  )
)
