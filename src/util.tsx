import React, { RefObject } from 'react'
import { Vector2 } from 'three'
import * as THREE from 'three'
import { type ReactThreeFiber, type ThreeElement, extend, useThree } from '@react-three/fiber'
import type { Effect, Pass, BlendFunction } from 'postprocessing'

export const resolveRef = <T,>(ref: T | React.RefObject<T>) =>
  typeof ref === 'object' && ref != null && 'current' in ref ? ref.current : ref

export type EffectConstructor = new (...args: any[]) => Effect | Pass

export type EffectProps<T extends EffectConstructor> = ThreeElement<T> &
  ConstructorParameters<T>[0] & {
    blendFunction?: BlendFunction
    opacity?: number
  }

let i = 0
const components = new WeakMap<EffectConstructor, React.ExoticComponent<any> | string>()

export const wrapEffect = <T extends EffectConstructor>(effect: T, defaults?: EffectProps<T>) =>
  /* @__PURE__ */ function Effect({ blendFunction = defaults?.blendFunction, opacity = defaults?.opacity, ...props }) {
    let Component = components.get(effect)
    if (!Component) {
      const key = `@react-three/postprocessing/${effect.name}-${i++}`
      extend({ [key]: effect })
      components.set(effect, (Component = key))
    }

    const camera = useThree((state) => state.camera)
    const args = React.useMemo(
      () => [...(defaults?.args ?? []), ...(props.args ?? [{ ...defaults, ...props }])],
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [JSON.stringify(props)]
    )

    return (
      <Component
        camera={camera}
        blendMode-blendFunction={blendFunction}
        blendMode-opacity-value={opacity}
        {...props}
        args={args}
      />
    )
  }

export const useVector2 = (props: Record<string, unknown>, key: string): THREE.Vector2 => {
  const value = props[key] as ReactThreeFiber.Vector2 | undefined
  return React.useMemo(() => {
    if (typeof value === 'number') return new THREE.Vector2(value, value)
    else if (value) return new THREE.Vector2(...(value as THREE.Vector2Tuple))
    else return new THREE.Vector2()
  }, [value])
}
