import { GodRaysEffect } from 'postprocessing'
import React, { Ref, forwardRef, useMemo, useContext } from 'react'
import { Mesh, Points } from 'three'
import { EffectComposerContext } from '../EffectComposer'
import { useLayoutEffect } from 'react'
import { resolveRef } from '../util'

type GodRaysProps = ConstructorParameters<typeof GodRaysEffect>[2] & {
  sun: Mesh | Points | React.MutableRefObject<Mesh | Points>
}

export const GodRays = forwardRef(function GodRays(props: GodRaysProps, ref: Ref<GodRaysEffect>) {
  const { camera } = useContext(EffectComposerContext)
  const effect = useMemo(() => new GodRaysEffect(camera, resolveRef(props.sun), props), [camera, props])
  // @ts-ignore v6.30.2 https://github.com/pmndrs/postprocessing/pull/470/commits/091ef6f9516ca02efa7576305afbecf1ce8323ae
  useLayoutEffect(() => void (effect.lightSource = resolveRef(props.sun)), [effect, props.sun])
  return <primitive ref={ref} object={effect} dispose={null} />
})
