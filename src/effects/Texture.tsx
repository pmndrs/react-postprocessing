import { TextureEffect } from 'postprocessing'
import { useImperativeHandle, useMemo, forwardRef, ForwardRefExoticComponent } from 'react'
import { useLoader } from 'react-three-fiber'
import { TextureLoader, sRGBEncoding, RepeatWrapping } from 'three'

type TextureProps = ConstructorParameters<typeof TextureEffect>[0] & {
  textureSrc: string
}

export const Texture: ForwardRefExoticComponent<TextureProps> = forwardRef(
  ({ textureSrc, ...props }: TextureProps, ref) => {
    const texture = useLoader(TextureLoader, textureSrc)

    texture.encoding = sRGBEncoding
    texture.wrapS = texture.wrapT = RepeatWrapping

    const effect = useMemo(() => new TextureEffect({ ...props, texture }), [props])

    useImperativeHandle(ref, () => effect, [effect])
    return null
  }
)
