import { GodRaysEffect } from 'postprocessing'
import React, { Ref, forwardRef, useMemo } from 'react'
import { useThree } from 'react-three-fiber'
import { Mesh, Points } from 'three'

type GodRaysProps = ConstructorParameters<typeof GodRaysEffect>[2] & {
  sun: Mesh | Points
}

export const GodRays = forwardRef(function GodRays(props: GodRaysProps, ref: Ref<GodRaysEffect>) {
  const { camera } = useThree()
  const effect = useMemo(() => new GodRaysEffect(camera, props.sun, props), [camera, props])
  return <primitive ref={ref} object={effect} dispose={null} />
})
