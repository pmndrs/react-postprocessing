import * as THREE from 'three'
import React, { forwardRef, useMemo, useEffect, useLayoutEffect, createContext, useRef, useImperativeHandle } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { EffectComposer as EffectComposerImpl, RenderPass, EffectPass, NormalPass } from 'postprocessing'
import { TextureDataType } from 'three'
import { isWebGL2Available } from 'three-stdlib'

export const EffectComposerContext = createContext<{
  composer: EffectComposerImpl
  normalPass: NormalPass | null
  camera: THREE.Camera
  scene: THREE.Scene
}>(null)

export type EffectComposerProps = {
  enabled?: boolean
  children: JSX.Element | JSX.Element[]
  depthBuffer?: boolean
  disableNormalPass?: boolean
  stencilBuffer?: boolean
  autoClear?: boolean
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
        enabled = true,
        renderPriority = 1,
        autoClear = true,
        depthBuffer,
        disableNormalPass,
        stencilBuffer,
        multisampling = 8,
        frameBufferType = THREE.HalfFloatType,
      }: EffectComposerProps,
      ref
    ) => {
      const { gl, scene: defaultScene, camera: defaultCamera, size } = useThree()
      scene = scene || defaultScene
      camera = camera || defaultCamera

      const [composer, normalPass] = useMemo(() => {
        // Initialize composer
        const effectComposer = new EffectComposerImpl(gl, {
          depthBuffer,
          stencilBuffer,
          multisampling: multisampling > 0 && isWebGL2Available() ? multisampling : 0,
          frameBufferType,
        })
        // Add render pass
        effectComposer.addPass(new RenderPass(scene, camera))
        // Create normal pass
        const pass = disableNormalPass ? null : new NormalPass(scene, camera)
        if (pass) pass.enabled = false

        if (pass) {
          effectComposer.addPass(pass)
        }
        return [effectComposer, pass]
      }, [camera, gl, depthBuffer, stencilBuffer, multisampling, frameBufferType, scene, disableNormalPass])

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
          composer.addPass(effectPass)
          effectPass.renderToScreen = true
          if (normalPass) normalPass.enabled = true
        }
        return () => {
          if (effectPass) composer?.removePass(effectPass)
          if (normalPass) normalPass.enabled = false
        }
      }, [composer, children, camera])

      // Memoize state, otherwise it would trigger all consumers on every render
      const state = useMemo(() => ({ composer, normalPass, camera, scene }), [composer, normalPass, camera, scene])

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
