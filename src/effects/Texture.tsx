import { useLoader } from '@react-three/fiber'
import { TextureEffect } from 'postprocessing'
import type { Ref } from 'react'
import { useLayoutEffect } from 'react'
import { RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

const TextureImpl = /* @__PURE__ */ createEffectComponent<typeof TextureEffect, EffectOptions<typeof TextureEffect>>(
  TextureEffect
)

export type TextureProps = EffectOptions<typeof TextureEffect> & {
  textureSrc: string
  /** opacity of provided texture */
  opacity?: number
  ref?: Ref<TextureEffect>
}

export function Texture({ textureSrc, texture, opacity = 1, ...props }: TextureProps) {
  const t = useLoader(TextureLoader, textureSrc)

  useLayoutEffect(() => {
    t.colorSpace = SRGBColorSpace
    t.wrapS = t.wrapT = RepeatWrapping
  }, [t])

  return <TextureImpl {...props} texture={texture ?? t} opacity={opacity} />
}
