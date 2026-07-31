import { GodRaysEffect } from 'postprocessing'
import { Ref, RefObject, useContext, useLayoutEffect, useMemo } from 'react'
import { Mesh, Points } from 'three'
import { EffectComposerContext } from '../EffectComposer'
import { resolveRef, useDispose } from '../util'

type GodRaysProps = ConstructorParameters<typeof GodRaysEffect>[2] & {
  sun: Mesh | Points | RefObject<Mesh | Points>
  ref?: Ref<GodRaysEffect>
}

export function GodRays({ ref, ...props }: GodRaysProps) {
  const { camera } = useContext(EffectComposerContext)
  const effect = useMemo(() => new GodRaysEffect(camera, resolveRef(props.sun), props), [camera, props])
  useLayoutEffect(() => void (effect.lightSource = resolveRef(props.sun)), [effect, props.sun])

  useDispose(effect)

  return <primitive ref={ref} object={effect} />
}
