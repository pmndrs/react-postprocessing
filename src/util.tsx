import * as React from 'react'
import * as THREE from 'three'
import { extend, invalidate, ReactThreeFiber } from '@react-three/fiber'
import type { Effect, BlendFunction } from 'postprocessing'

export const resolveRef = <T extends object>(ref: T | React.MutableRefObject<T>) =>
  ref && 'current' in ref ? ref.current : ref

export type EffectConstructor = new (...args: any[]) => Effect

export type EffectProps<T extends EffectConstructor> = ReactThreeFiber.Node<
  T extends Function ? T['prototype'] : InstanceType<T>,
  T
> & {
  blendFunction?: BlendFunction
  opacity?: number
}

let i = 0
export const wrapEffect = <T extends EffectConstructor>(
  effect: T,
  props?: EffectProps<typeof effect>
): React.ExoticComponent<typeof props> => {
  const identifier = `__react-postprocessing__${i++}`
  extend({
    [identifier]: class extends effect {
      _camera: THREE.Camera | null = null

      constructor(..._args: any[]) {
        super(...((props?.args as any[]) ?? []), ..._args)
        Object.assign(this, props)
      }

      private get _context() {
        return (this as any).__r3f?.root.getState()
      }

      get camera() {
        return this._camera ?? this._context?.camera
      }
      set camera(value) {
        this._camera = value
      }

      get blendFunction() {
        return this.blendMode.blendFunction
      }
      set blendFunction(value) {
        this.blendMode.blendFunction = value
      }

      get opacity() {
        return this.blendMode.opacity.value
      }
      set opacity(value) {
        this.blendMode.opacity.value = value
      }

      onUpdate() {
        invalidate(this._context)
      }
    },
  })
  return identifier as any
}

export const useVector2 = (props: any, key: string): THREE.Vector2 => {
  const vec: ReactThreeFiber.Vector2 = props[key]
  return React.useMemo(() => {
    if (typeof vec === 'number') return new THREE.Vector2(vec, vec)
    else return new THREE.Vector2(...(vec as THREE.Vector2Tuple))
  }, [vec])
}
