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
> &
  ConstructorParameters<T>[0] & {
    blendFunction?: BlendFunction
    opacity?: number
  }

let i = 0
const components = new WeakMap<EffectConstructor, React.ExoticComponent<any>>()

export const wrapEffect = <T extends EffectConstructor, P extends EffectProps<T>>(effect: T, defaults?: P) =>
  /* @__PURE__ */ React.forwardRef<T, P>(function Effect(
    { blendFunction = defaults?.blendFunction, opacity = defaults?.opacity, ...props },
    ref
  ) {
    let Component = components.get(effect)
    if (!Component) {
      const key = `@react-three/postprocessing/${effect.name}-${i++}`
      extend({ [key]: effect })
      components.set(effect, (Component = key as any))
    }

    const camera = useThree((state) => state.camera)
    const args = React.useMemo(
      () => [...((defaults?.args ?? []) as any[]), ...((props.args ?? [{ ...defaults, ...props }]) as any[])],
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [JSON.stringify(props)]
    )

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

export const useVector2 = (props: object, key: string): THREE.Vector2 => {
  const value: ReactThreeFiber.Vector2 | undefined = props[key]
  return React.useMemo(() => {
    if (typeof value === 'number') return new THREE.Vector2(value, value)
    else if (value) return new THREE.Vector2(...(value as THREE.Vector2Tuple))
    else return new THREE.Vector2()
  }, [value])
}
