import React, { createRef, useMemo, useEffect, createContext, RefObject, cloneElement, Ref } from 'react'
import { useThree, useFrame, useLoader } from 'react-three-fiber'
import {
  EffectComposer as EffectComposerImpl,
  RenderPass,
  EffectPass,
  NormalPass,
  Effect,
  SMAAEffect,
  SMAAImageLoader,
  DepthOfFieldEffect,
} from 'postprocessing'
import { HalfFloatType } from 'three'
import mergeRefs from 'react-merge-refs'

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
      // Initialiaze SMAAEffect
      const smaaEffect = new SMAAEffect(...smaaProps)
      smaaEffect.colorEdgesMaterial.setEdgeDetectionThreshold(edgeDetection)
      return [effectComposer, smaaEffect, pass]
    }, [camera, gl, scene])

    useEffect(() => void composer.setSize(size.width, size.height), [composer, size])
    useFrame((_, delta) => composer.render(delta), renderPriority)

    const refs: RefObject<Effect>[] = useMemo(
      () => [...new Array(React.Children.count(children))].map(createRef) as RefObject<Effect>[],
      [children]
    )

    useEffect(() => {
      const resolvedEffects = refs.map((r) => r.current)
      const effectPass = new EffectPass(camera, ...(smaa ? [smaaEffect, ...resolvedEffects] : resolvedEffects))
      composer.addPass(normalPass)
      composer.addPass(effectPass)
      effectPass.renderToScreen = true
    }, [composer, camera, normalPass, refs])

    // Memoize state, otherwise it would trigger all consumers on every render
    const state = useMemo(() => ({ composer, normalPass }), [composer, normalPass])

    return (
      <EffectComposerContext.Provider value={state}>
        {React.Children.map(children, (el: JSX.Element & { ref: Ref<Effect> }, i) =>
          cloneElement(el, { ref: mergeRefs([refs[i], el.ref]) })
        )}
      </EffectComposerContext.Provider>
    )
  }
)

export default EffectComposer
