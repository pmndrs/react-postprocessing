import { TextureEffect } from 'postprocessing'
import { useImperativeHandle, useMemo, forwardRef } from 'react'

export const Texture = forwardRef((props: TextureEffect, ref) => {
  const effect = useMemo(() => new TextureEffect(props), [props])
  useImperativeHandle(ref, () => effect, [effect])
  return null
})
