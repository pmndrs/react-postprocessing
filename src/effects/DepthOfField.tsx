import { DepthOfFieldEffect } from 'postprocessing'

import { forwardRef, useMemo, useImperativeHandle, useLayoutEffect } from 'react'
import { useThree, ReactThreeFiber } from 'react-three-fiber'
import { Texture } from 'three'

type DOFProps = DepthOfFieldEffect &
  Partial<{
    target: ReactThreeFiber.Vector3
    depthTexture: {
      texture: Texture
      packing: number
    }
  }>

export const DepthOfField = forwardRef(({ target, depthTexture, ...props }: DOFProps, ref) => {
  const { camera } = useThree()

  const effect = useMemo(() => new DepthOfFieldEffect(camera, props), [props])

  useLayoutEffect(() => {
    if (target) {
      effect.target = target
    }
  }, [target])

  useLayoutEffect(() => {
    if (depthTexture) {
      effect.setDepthTexture(depthTexture.texture, depthTexture.packing)
    }
  }, [depthTexture])

  useImperativeHandle(ref, () => effect, [effect])
  return null
})
