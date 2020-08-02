import { TextureEffect } from 'postprocessing'
import React, { useMemo, useLayoutEffect } from 'react'
import { useLoader } from 'react-three-fiber'
import { TextureLoader, sRGBEncoding, RepeatWrapping } from 'three'

type TextureProps = ConstructorParameters<typeof TextureEffect>[0] & {
  textureSrc: string
}

export const Texture = ({ textureSrc, texture, ...props }: TextureProps) => {
  const t = useLoader(TextureLoader, textureSrc)
  useLayoutEffect(() => {
    t.encoding = sRGBEncoding
    t.wrapS = t.wrapT = RepeatWrapping
  }, [t])
  const effect = useMemo(() => new TextureEffect({ ...props, texture: t || texture }), [props])
  return <primitive object={effect} dispose={null} />
}
