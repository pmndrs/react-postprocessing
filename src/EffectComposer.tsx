import type { TextureDataType } from 'three'
import { HalfFloatType, NoToneMapping } from 'three'
import React, {
  forwardRef,
  useMemo,
  useEffect,
  useLayoutEffect,
  createContext,
  useRef,
  useImperativeHandle,
} from 'react'
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
        if (enableNormalPass) {
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
        enableNormalPass,
        resolutionScale,
      ])

      useEffect(() => composer?.setSize(size.width, size.height), [composer, size])
      useFrame(
        (_, delta) => {
          if (enabled) {
            const currentAutoClear = gl.autoClear
            gl.autoClear = autoClear
            if (stencilBuffer && !autoClear) gl.clearStencil()
            composer.render(delta)
            gl.autoClear = currentAutoClear
          }
        },
        enabled ? renderPriority : 0
      )

      const group = useRef(null)
      const instance = useInstanceHandle(group)
      useLayoutEffect(() => {
        const passes: Pass[] = []

        if (group.current && instance.current && composer) {
          const children = instance.current.children

          for (let i = 0; i < children.length; i++) {
            const child = children[i].object

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

          for (const pass of passes) composer?.addPass(pass)

          if (normalPass) normalPass.enabled = true
          if (downSamplingPass) downSamplingPass.enabled = true
        }

        return () => {
          for (const pass of passes) composer?.removePass(pass)
          if (normalPass) normalPass.enabled = false
          if (downSamplingPass) downSamplingPass.enabled = false
        }
      }, [composer, children, camera, normalPass, downSamplingPass, instance])

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
