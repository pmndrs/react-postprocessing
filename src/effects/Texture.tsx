import { TextureEffect } from 'postprocessing'
import { useImperativeHandle, useMemo, forwardRef, ForwardRefExoticComponent } from 'react'
import { useLoader } from 'react-three-fiber'
import { TextureLoader, sRGBEncoding, RepeatWrapping } from 'three'

type TextureProps = ConstructorParameters<typeof TextureEffect>[0] & {
  textureSrc: string
}

export const Texture: ForwardRefExoticComponent<TextureProps> = forwardRef(
  ({ textureSrc, texture, ...props }: TextureProps, ref) => {
    const t = useLoader(TextureLoader, textureSrc)

    t.encoding = sRGBEncoding
    t.wrapS = t.wrapT = RepeatWrapping

    const effect = useMemo(() => new TextureEffect({ ...props, texture: t || texture }), [props])

    useImperativeHandle(ref, () => effect, [effect])
    return null
  }
)
