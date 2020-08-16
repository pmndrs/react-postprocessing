import * as THREE from 'three'
import React, { forwardRef, useMemo, useEffect, createContext, useRef, useImperativeHandle } from 'react'
import { useThree, useFrame } from 'react-three-fiber'
import { EffectComposer as EffectComposerImpl, RenderPass, EffectPass, NormalPass } from 'postprocessing'
import { HalfFloatType } from 'three'

export const EffectComposerContext = createContext<{
  composer: EffectComposerImpl
  normalPass: NormalPass
  camera: THREE.Camera
  scene: THREE.Scene
}>(null)

export type EffectComposerProps = {
  children: JSX.Element | JSX.Element[]
  multisampling?: number
  renderPriority?: number
  camera?: THREE.Camera
  scene?: THREE.Scene
}

const EffectComposer = forwardRef(
  ({ children, camera, scene, renderPriority = 1, multisampling = 8, ...props }: EffectComposerProps, ref) => {
    const { gl, scene: defaultScene, camera: defaultCamera, size } = useThree()
    scene = scene || defaultScene
    camera = camera || defaultCamera
    const pixelRatio = gl.getPixelRatio()
    const [composer, normalPass] = useMemo(() => {
      // Initialize composer
      const effectComposer = new EffectComposerImpl(gl, { multisampling, frameBufferType: HalfFloatType, ...props })
      // Add render pass
      effectComposer.addPass(new RenderPass(scene, camera))
      // Create normal pass
      const pass = new NormalPass(scene, camera)
      effectComposer.addPass(pass)
      return [effectComposer, pass]
    }, [camera, gl, multisampling, props, scene])

    useEffect(() => {
      composer.setSize(size.width * pixelRatio, size.height * pixelRatio)
    }, [composer, size, pixelRatio])
    useFrame((_, delta) => composer.render(delta), renderPriority)

    const group = useRef()
    useEffect(() => {
      if (group.current) {
        const effectPass = new EffectPass(camera, ...(group.current as any).__objects)
        composer.addPass(effectPass)
        effectPass.renderToScreen = true
        return () => composer.removePass(effectPass)
      }
    }, [composer, camera, children])

    // Memoize state, otherwise it would trigger all consumers on every render
    const state = useMemo(() => ({ composer, normalPass, camera, scene }), [composer, normalPass, camera, scene])

    // Expose the composer
    useImperativeHandle(ref, () => composer, [])

    return (
      <EffectComposerContext.Provider value={state}>
        <group ref={group}>{children}</group>
      </EffectComposerContext.Provider>
    )
  }
)

export default EffectComposer
