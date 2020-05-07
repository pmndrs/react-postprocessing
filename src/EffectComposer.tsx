import React, { createRef } from 'react'
import { useThree, useFrame } from 'react-three-fiber'
import { useMemo, useEffect, createContext } from 'react'
import {
  EffectComposer as EffectComposerImpl,
  RenderPass,
  EffectPass,
  NormalPass,
  Effect,
  // @ts-ignore
} from 'postprocessing'
import { HalfFloatType } from 'three'

export const EffectComposerContext = createContext(null)

const EffectComposer = React.memo(({ children }: { children: JSX.Element | JSX.Element[] }) => {
  const { gl, scene, camera, size } = useThree()
  const [composer, normalPass] = useMemo(() => {
    const composer = new EffectComposerImpl(gl, { frameBufferType: HalfFloatType })
    composer.addPass(new RenderPass(scene, camera))
    const normalPass = (composer.normalPass = new NormalPass(scene, camera))
    return [composer, normalPass]
  }, [children])

  useEffect(() => void composer.setSize(size.width, size.height), [composer, size])
  useFrame((_, delta) => composer.render(delta), 1)

  const refs = useMemo(() => [...new Array(React.Children.count(children))].map(createRef), [children])
  useEffect(() => {
    composer.addPass(normalPass)
    const effectPass = new EffectPass(camera, ...refs.map((r) => r.current))
    composer.addPass(effectPass)
    effectPass.renderToScreen = true
    return () => composer.reset()
  }, [children])

  return (
    <EffectComposerContext.Provider value={composer}>
      {React.Children.map(children, (el: JSX.Element, i) => (
        <el.type {...el.props} ref={refs[i]} />
      ))}
    </EffectComposerContext.Provider>
  )
})

export default EffectComposer
