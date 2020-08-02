import React, { useMemo, useEffect, createContext, useRef } from 'react'
import { useThree, useFrame, useLoader } from 'react-three-fiber'
import {
  EffectComposer as EffectComposerImpl,
  RenderPass,
  EffectPass,
  NormalPass,
  SMAAEffect,
  SMAAImageLoader,
} from 'postprocessing'
import { HalfFloatType } from 'three'

export const EffectComposerContext = createContext<{
  composer: EffectComposerImpl
  normalPass: NormalPass
}>(null)

export type EffectComposerProps = {
  children: JSX.Element | JSX.Element[]
  smaa?: boolean
  edgeDetection?: number
  renderPriority?: number
}

const EffectComposer = React.memo(
  ({ children, smaa = true, edgeDetection = 0.1, renderPriority = 1 }: EffectComposerProps) => {
    const { gl, scene, camera, size } = useThree()

    // Load SMAA
    const smaaProps: [any, any] = useLoader(SMAAImageLoader, '' as any)
    const [composer, smaaEffect, normalPass] = useMemo(() => {
      // Initialize composer
      const effectComposer = new EffectComposerImpl(gl, { frameBufferType: HalfFloatType })
      // Add render pass
      effectComposer.addPass(new RenderPass(scene, camera))
      // Create normal pass
      const pass = new NormalPass(scene, camera)
      effectComposer.addPass(pass)
      // Initialiaze SMAAEffect
      const smaaEffect = new SMAAEffect(...smaaProps)
      smaaEffect.colorEdgesMaterial.setEdgeDetectionThreshold(edgeDetection)
      return [effectComposer, smaaEffect, pass]
    }, [camera, gl, scene, children])

    useEffect(() => void composer.setSize(size.width, size.height), [composer, size])
    useFrame((_, delta) => composer.render(delta), renderPriority)

    const group = useRef()
    useEffect(() => {
      if (group.current) {
        const resolvedEffects = (group.current as any).__objects
        const effectPass = new EffectPass(camera, ...(smaa ? [smaaEffect, ...resolvedEffects] : resolvedEffects))
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
