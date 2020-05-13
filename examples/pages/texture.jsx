import React, { useMemo, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from 'react-three-fiber'
import { EffectComposer, Glitch, Texture } from '../../dist/esm'
import { OrbitControls, Sky } from 'drei'
import { Box } from './glitch-and-noise'
import { TextureLoader, sRGBEncoding, RepeatWrapping } from 'three'
import textureUrl from 'url:../public/texture.png'

const TextureDemoBody = () => {
  const loadedTexture = useLoader(TextureLoader, textureUrl)

  const texture = useMemo(() => {
    loadedTexture.encoding = sRGBEncoding
    loadedTexture.wrapS = loadedTexture.wrapT = RepeatWrapping

    return loadedTexture
  }, [loadedTexture])

  return (
    <>
      <OrbitControls />
      <Box />
      <Sky />
      <EffectComposer smaa={false}>
        <Texture texture={texture} />
      </EffectComposer>
    </>
  )
}

const TextureDemo = () => (
  <>
    <h2>glitch + noise</h2>
    <div className="container">
      <Canvas>
        <Suspense fallback={null}>
          <TextureDemoBody />
        </Suspense>
      </Canvas>
    </div>
  </>
)

export default TextureDemo
