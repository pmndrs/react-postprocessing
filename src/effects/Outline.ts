import { OutlineEffect } from 'postprocessing'
import { forwardRef, useMemo, useImperativeHandle } from 'react'
import { useThree } from 'react-three-fiber'

const Outline = forwardRef((props: OutlineEffect, ref) => {
  const { scene, camera } = useThree()

  const effect = useMemo(() => new OutlineEffect(scene, camera, props), [props])
  useImperativeHandle(ref, () => effect, [effect])
  return null
})

export default Outline
