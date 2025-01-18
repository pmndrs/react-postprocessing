import { TextureEffect } from 'postprocessing'
import { Ref, forwardRef, useMemo, useLayoutEffect } from 'react'
import { useLoader } from '@react-three/fiber'
import { TextureLoader, SRGBColorSpace, RepeatWrapping } from 'three'

type TextureProps = ConstructorParameters<typeof TextureEffect>[0] & {
  textureSrc: string
  /** opacity of provided texture */
  opacity?: number
}

export const Texture = /* @__PURE__ */ forwardRef<TextureEffect, TextureProps>(function Texture(
  { textureSrc, texture, opacity = 1, ...props }: TextureProps,
  ref: Ref<TextureEffect>
) {
  const t = useLoader(TextureLoader, textureSrc)
  useLayoutEffect(() => {
    t.colorSpace = SRGBColorSpace
    t.wrapS = t.wrapT = RepeatWrapping
  }, [t])
  const effect = useMemo(() => new TextureEffect({ ...props, texture: t || texture }), [props, t, texture])
  return <primitive ref={ref} object={effect} blendMode-opacity-value={opacity} dispose={null} />
})
