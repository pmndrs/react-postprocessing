import React, { useMemo, Suspense } from 'react'
import { Canvas, useFrame, useLoader, useThree } from 'react-three-fiber'
import { EffectComposer, Glitch, Texture } from '../../dist/esm'
import { OrbitControls, Sky } from 'drei'
import { Box } from './glitch-and-noise'
import { TextureLoader, sRGBEncoding, RepeatWrapping, LinearFilter } from 'three'
import textureUrl from 'url:../public/texture.png'

const TextureDemoBody = () => {
  const { gl } = useThree()

  const loadedTexture = useLoader(TextureLoader, textureUrl, () => {
    gl.outputEncoding = sRGBEncoding
  })

  const texture = useMemo(() => {
    loadedTexture.encoding = sRGBEncoding
    loadedTexture.wrapS = loadedTexture.wrapT = RepeatWrapping
    loadedTexture.minFilter = loadedTexture.magFilter = LinearFilter

    return loadedTexture
  }, [loadedTexture])

  return (
    <>
      <OrbitControls />
      <Box />
      <Sky />
      <EffectComposer>
        <Texture texture={texture} />
      </EffectComposer>
    </>
  )
}

const TextureDemo = () => (
  <>
    <h2>glitch + noise [broken]</h2>
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
