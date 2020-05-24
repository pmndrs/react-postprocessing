import { TextureEffect } from 'postprocessing'
import { useImperativeHandle, useMemo, forwardRef } from 'react'

const Texture = forwardRef((props: TextureEffect, ref) => {
  const effect = useMemo(() => new TextureEffect(props), [props])
  useImperativeHandle(ref, () => effect, [effect])
  return null
})

export default Texture
