import type { TextureDataType } from 'three'
import { HalfFloatType, NoToneMapping } from 'three'
import React, { forwardRef, useMemo, useEffect, createContext, useRef, useImperativeHandle } from 'react'
import { useThree, useFrame, useInstanceHandle } from '@react-three/fiber'
import {
  EffectComposer as EffectComposerImpl,
  RenderPass,
  EffectPass,
  NormalPass,
  // @ts-ignore
  DepthDownsamplingPass,
  Effect,
  Pass,
  EffectAttribute,
} from 'postprocessing'
import { isWebGL2Available } from 'three-stdlib'

export const EffectComposerContext = createContext<{
  composer: EffectComposerImpl
  normalPass: NormalPass | null
  downSamplingPass: DepthDownsamplingPass | null
  camera: THREE.Camera
  scene: THREE.Scene
  resolutionScale?: number
}>(null!)

export type EffectComposerProps = {
  enabled?: boolean
  children: JSX.Element | JSX.Element[]
  depthBuffer?: boolean
  /** Only used for SSGI currently, leave it disabled for everything else unless it's needed */
  enableNormalPass?: boolean
  stencilBuffer?: boolean
  autoClear?: boolean
  resolutionScale?: number
  multisampling?: number
  frameBufferType?: TextureDataType
  renderPriority?: number
  camera?: THREE.Camera
  scene?: THREE.Scene
}

const isConvolution = (effect: Effect): boolean =>
  (effect.getAttributes() & EffectAttribute.CONVOLUTION) === EffectAttribute.CONVOLUTION

export const EffectComposer = React.memo(
  forwardRef(
    (
      {
        children,
        camera: _camera,
        scene: _scene,
        resolutionScale,
        enabled = true,
        renderPriority = 1,
        autoClear = true,
        depthBuffer,
        enableNormalPass,
        stencilBuffer,
        multisampling = 8,
        frameBufferType = HalfFloatType,
      }: EffectComposerProps,
      ref
    ) => {
      const { gl, scene: defaultScene, camera: defaultCamera, size } = useThree()
      const scene = _scene || defaultScene
      const camera = _camera || defaultCamera

      const composer = useRef<EffectComposerImpl | undefined>()
      const normalPass = useRef<NormalPass | undefined>()
      const downSamplingPass = useRef<DepthDownsamplingPass | undefined>()

      const group = useRef(null)
      const instance = useInstanceHandle(group)

      useEffect(() => {
        const webGL2Available = isWebGL2Available()

        // Initialize composer
        composer.current = new EffectComposerImpl(gl, {
          depthBuffer,
          stencilBuffer,
          multisampling: multisampling > 0 && webGL2Available ? multisampling : 0,
          frameBufferType,
        })

        // Add render pass
        composer.current.addPass(new RenderPass(scene, camera))

        // Create normal pass
        if (enableNormalPass) {
          normalPass.current = new NormalPass(scene, camera)
          normalPass.current.enabled = false
          composer.current.addPass(normalPass.current)
          if (resolutionScale !== undefined && webGL2Available) {
            downSamplingPass.current = new DepthDownsamplingPass({
              normalBuffer: normalPass.current.texture,
              resolutionScale,
            })
            downSamplingPass.current.enabled = false
            composer.current.addPass(downSamplingPass.current)
          }
        }

        const passes: Pass[] = []

        if (group.current && instance.current && composer.current) {
          const children = instance.current.objects as unknown[]

          for (let i = 0; i < children.length; i++) {
            const child = children[i]

            if (child instanceof Effect) {
              const effects: Effect[] = [child]

              if (!isConvolution(child)) {
                let next: unknown = null
                while ((next = children[i + 1]) instanceof Effect) {
                  if (isConvolution(next)) break
                  effects.push(next)
                  i++
                }
              }

              const pass = new EffectPass(camera, ...effects)
              passes.push(pass)
            } else if (child instanceof Pass) {
              passes.push(child)
            }
          }

          for (const pass of passes) composer.current?.addPass(pass)

          if (normalPass.current) normalPass.current.enabled = true
          if (downSamplingPass.current) downSamplingPass.current.enabled = true
        }

        return () => {
          for (const pass of passes) composer.current?.removePass(pass)
          if (normalPass.current) normalPass.current.enabled = false
          if (downSamplingPass.current) downSamplingPass.current.enabled = false
          normalPass.current?.dispose()
          downSamplingPass.current?.dispose()
          composer.current?.dispose()

          composer.current = undefined
          normalPass.current = undefined
          downSamplingPass.current = undefined
        }
      }, [
        camera,
        gl,
        depthBuffer,
        stencilBuffer,
        multisampling,
        frameBufferType,
        scene,
        enableNormalPass,
        resolutionScale,
        instance,
      ])

      useEffect(() => composer.current?.setSize(size.width, size.height), [size])
      useFrame(
        (_, delta) => {
          if (enabled) {
            const currentAutoClear = gl.autoClear
            gl.autoClear = autoClear
            if (stencilBuffer && !autoClear) gl.clearStencil()
            composer.current?.render(delta)
            gl.autoClear = currentAutoClear
          }
        },
        enabled ? renderPriority : 0
      )

      // Disable tone mapping because threejs disallows tonemapping on render targets
      useEffect(() => {
        const currentTonemapping = gl.toneMapping
        gl.toneMapping = NoToneMapping
        return () => {
          gl.toneMapping = currentTonemapping
        }
      }, [])

      // Memoize state, otherwise it would trigger all consumers on every render
      const state = useMemo(
        () => ({
          composer: composer.current!,
          normalPass: normalPass.current!,
          downSamplingPass: downSamplingPass.current!,
          resolutionScale,
          camera,
          scene,
        }),
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
