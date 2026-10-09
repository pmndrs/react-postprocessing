import { useLoader } from '@react-three/fiber'
import { TextureEffect } from 'postprocessing'
import type { Ref } from 'react'
import { useLayoutEffect } from 'react'
import { RepeatWrapping, SRGBColorSpace, TextureLoader, type Texture as ThreeTexture } from 'three'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

const TextureImpl = /* @__PURE__ */ createEffectComponent<typeof TextureEffect, EffectOptions<typeof TextureEffect>>(
  TextureEffect
)

export type TextureProps = Omit<EffectOptions<typeof TextureEffect>, 'texture'> & {
  /** opacity of provided texture */
  opacity?: number
  ref?: Ref<TextureEffect>
} & ({ textureSrc: string; texture?: never } | { texture: ThreeTexture; textureSrc?: never })

export function Texture({ textureSrc, texture, opacity = 1, ...props }: TextureProps) {
  if (texture) return <TextureImpl {...props} texture={texture} opacity={opacity} />
  return <LoadedTexture {...props} textureSrc={textureSrc!} opacity={opacity} />
}

function LoadedTexture({ textureSrc, ...props }: TextureProps & { textureSrc: string }) {
  const t = useLoader(TextureLoader, textureSrc)

  useLayoutEffect(() => {
    t.colorSpace = SRGBColorSpace
    t.wrapS = t.wrapT = RepeatWrapping
  }, [t])

  return <TextureImpl {...props} texture={t} />
}
