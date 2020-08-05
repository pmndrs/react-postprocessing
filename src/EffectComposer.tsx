import React, { useMemo, useEffect, createContext, useRef } from 'react'
import { useThree, useFrame } from 'react-three-fiber'
import { EffectComposer as EffectComposerImpl, RenderPass, EffectPass, NormalPass } from 'postprocessing'
import { HalfFloatType } from 'three'

export const EffectComposerContext = createContext<{
  composer: EffectComposerImpl
  normalPass: NormalPass
}>(null)

export type EffectComposerProps = {
  children: JSX.Element | JSX.Element[]
  multisampling?: number
  renderPriority?: number
}

const EffectComposer = React.memo(
  ({ children, renderPriority = 1, multisampling = 8, ...props }: EffectComposerProps) => {
    const { gl, scene, camera, size } = useThree()

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

    useEffect(() => void composer.setSize(size.width, size.height), [composer, size])
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
    const state = useMemo(() => ({ composer, normalPass }), [composer, normalPass])

    return (
      <EffectComposerContext.Provider value={state}>
        <group ref={group}>{children}</group>
      </EffectComposerContext.Provider>
    )
  }
)

export default EffectComposer
