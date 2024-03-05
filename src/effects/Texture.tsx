import { TextureEffect } from 'postprocessing'
import { Ref, forwardRef, useMemo, useLayoutEffect } from 'react'
import { useLoader } from '@react-three/fiber'
import { TextureLoader, RepeatWrapping } from 'three'

type TextureProps = ConstructorParameters<typeof TextureEffect>[0] & {
  textureSrc: string
}

export const Texture = forwardRef<TextureEffect, TextureProps>(function Texture(
  { textureSrc, texture, ...props }: TextureProps,
  ref: Ref<TextureEffect>
) {
  const t = useLoader(TextureLoader, textureSrc)
  useLayoutEffect(() => {
    // @ts-ignore
    if ('encoding' in t) t.encoding = 3001 // sRGBEncoding
    // @ts-ignore
    else t.colorSpace = 'srgb'
    t.wrapS = t.wrapT = RepeatWrapping
  }, [t])
  const effect = useMemo(() => new TextureEffect({ ...props, texture: t || texture }), [props, t, texture])
  return <primitive ref={ref} object={effect} dispose={null} />
})
