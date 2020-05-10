import React, { createRef, useMemo, useEffect, createContext, RefObject } from 'react'
import { useThree, useFrame } from 'react-three-fiber'
import { EffectComposer as EffectComposerImpl, RenderPass, EffectPass, NormalPass, Effect } from 'postprocessing'
import { HalfFloatType } from 'three'

export const EffectComposerContext = createContext(null)

const EffectComposer = React.memo(({ children }: { children: JSX.Element | JSX.Element[] }) => {
  const { gl, scene, camera, size } = useThree()

  const [composer] = useMemo(() => {
    const effectComposer = new EffectComposerImpl(gl, { frameBufferType: HalfFloatType })
    effectComposer.addPass(new RenderPass(scene, camera))

    return [effectComposer]
  }, [camera, gl, scene])

  useEffect(() => void composer.setSize(size.width, size.height), [composer, size])
  useFrame((_, delta) => composer.render(delta), 1)

  const refs = useMemo(
    (): RefObject<Effect>[] => [...new Array(React.Children.count(children))].map(createRef) as RefObject<Effect>[],
    [children]
  )

  useEffect(() => {
    const normalPass = new NormalPass(scene, camera)
    composer.addPass(normalPass)
    const effectPass = new EffectPass(camera, ...refs.map((r) => r.current))
    composer.addPass(effectPass)
    effectPass.renderToScreen = true
    return () => composer.reset()
  }, [children, composer, camera, refs])

  return (
    <EffectComposerContext.Provider value={composer}>
      {React.Children.map(children, (el: JSX.Element, i) => (
        <el.type {...el.props} ref={refs[i]} />
      ))}
    </EffectComposerContext.Provider>
  )
})

export default EffectComposer
