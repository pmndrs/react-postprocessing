import * as React from 'react'
import * as THREE from 'three'
import { type ReactThreeFiber, extend, useThree } from '@react-three/fiber'
import { type Effect, type BlendFunction } from 'postprocessing'

export const resolveRef = <T,>(ref: T | React.MutableRefObject<T>) =>
  typeof ref === 'object' && 'current' in ref ? ref.current : ref

export type EffectConstructor = new (...args: any[]) => Effect

export type EffectProps<T extends EffectConstructor> = ReactThreeFiber.Node<
  T extends Function ? T['prototype'] : InstanceType<T>,
  T
> & {
  key?: React.Key | null
  blendFunction?: BlendFunction
  opacity?: number
}

let i = 0
const components = new WeakMap<EffectConstructor, string>()

export const wrapEffect = <T extends EffectConstructor, P extends EffectProps<T>>(effect: T, defaults?: P) =>
  /* @__PURE__ */ React.forwardRef<T, P>(function Effect({ blendFunction, opacity, ...props }, ref) {
    const args = React.useMemo(
      () => [...((defaults?.args ?? []) as any[]), ...((props.args ?? []) as any[]), { ...defaults, ...props }],
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [JSON.stringify(props)]
    )
    const camera = useThree((state) => state.camera)

    let Component = components.get(effect)
    if (!Component) {
      Component = `@react-three/postprocessing/${effect.name}-${i++}`
      components.set(effect, Component)
      extend({ [Component]: effect })
    }

    return (
      <Component
        camera={camera}
        blendMode-blendFunction={blendFunction}
        blendMode-opacity={opacity}
        {...props}
        ref={ref}
        args={args}
      />
    )
  })

export const useVector2 = (props: any, key: string): THREE.Vector2 => {
  const vec: ReactThreeFiber.Vector2 = props[key]
  return React.useMemo(() => {
    if (typeof vec === 'number') return new THREE.Vector2(vec, vec)
    else return new THREE.Vector2(...(vec as THREE.Vector2Tuple))
  }, [vec])
}
