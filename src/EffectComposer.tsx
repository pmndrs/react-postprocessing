import React from 'react'
import { useThree, useFrame } from 'react-three-fiber'
import { useMemo, useEffect } from 'react'
import {
  EffectComposer as EffectComposerImpl,
  RenderPass,
  EffectPass,
  NormalPass,
  // @ts-ignore
} from 'postprocessing'
import { HalfFloatType } from 'three'

function EffectComposer({ children }: { children: any }) {
  const { gl, scene, camera, size } = useThree()

  const composer = useMemo(() => {
    const composer = new EffectComposerImpl(gl, {
      frameBufferType: HalfFloatType,
    })
    composer.addPass(new RenderPass(scene, camera))

    const normalPass = new NormalPass(scene, camera)

    composer.addPass(normalPass)
    return composer
  }, [camera, scene, gl])

  useEffect(() => {
    if (Array.isArray(children)) {
      const passes = children.map((child) => new EffectPass(camera, child.type()))

      // composer.addPass(camera, ...passes);

      passes.map((pass) => composer.addPass(pass))
    } else {
      const pass = new EffectPass(camera, children.type())
      composer.addPass(pass)
    }
  }, [composer, children, camera])

  useEffect(() => void composer.setSize(size.width, size.height), [composer, size])
  useFrame((_, delta) => composer.render(delta), 1)
  return <></>
}

export default EffectComposer
