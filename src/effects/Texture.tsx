import { useLoader } from '@react-three/fiber'
import { TextureEffect } from 'postprocessing'
import { Ref, useLayoutEffect, useMemo } from 'react'
import { RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three'
import { useDispose } from '../util'

type TextureProps = ConstructorParameters<typeof TextureEffect>[0] & {
  textureSrc: string
  /** opacity of provided texture */
  opacity?: number
  ref?: Ref<TextureEffect>
}

export function Texture({ textureSrc, texture, opacity = 1, ref, ...props }: TextureProps) {
  const t = useLoader(TextureLoader, textureSrc)

  useLayoutEffect(() => {
    t.colorSpace = SRGBColorSpace
    t.wrapS = t.wrapT = RepeatWrapping
  }, [t])

  const effect = useMemo(() => new TextureEffect({ ...props, texture: t || texture }), [])

  useDispose(effect)

  return <primitive ref={ref} object={effect} blendMode-opacity-value={opacity} />
}
