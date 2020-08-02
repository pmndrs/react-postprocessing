import { DepthOfFieldEffect } from 'postprocessing'
import React, { Ref, forwardRef, useMemo, useLayoutEffect } from 'react'
import { useThree, ReactThreeFiber } from 'react-three-fiber'
import { Texture, Vector3 } from 'three'

type DOFProps = ConstructorParameters<typeof DepthOfFieldEffect>[1] &
  Partial<{
    target: ReactThreeFiber.Vector3
    depthTexture: {
      texture: Texture
      packing: number
    }
    blur: number
  }>

export const DepthOfField = forwardRef(function DepthOfField(
  { target, depthTexture, ...props }: DOFProps,
  ref: Ref<DepthOfFieldEffect>
) {
  const { camera } = useThree()
  const effect = useMemo(() => new DepthOfFieldEffect(camera, props), [props])
  useLayoutEffect(() => {
    if (target) {
      const vec: Vector3 =
        target instanceof Vector3
          ? new Vector3().set(target.x, target.y, target.z)
          : new Vector3().set(target[0], target[1], target[2])
      effect.target = vec
    }
    if (depthTexture) effect.setDepthTexture(depthTexture.texture, depthTexture.packing)
  }, [target, depthTexture])
  return <primitive ref={ref} object={effect} dispose={null} />
})
