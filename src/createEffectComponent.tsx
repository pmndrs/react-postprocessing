import { extend, useThree } from '@react-three/fiber'
import type { BlendFunction, Effect, Pass } from 'postprocessing'
import type { ExoticComponent, JSX, Ref } from 'react'
import { useRef } from 'react'
import { useLiveDefaults, useMergeRefs } from './util'

export type EffectConstructor = new (...args: any[]) => Effect | Pass

// The effect's own options type, straight off its constructor - postprocessing
// already types every effect's sole options object precisely (either inline or,
// like BloomEffect, as a named exported type); this just strips the `| undefined`
// that comes from the parameter being optional.
export type EffectOptions<T extends EffectConstructor> = NonNullable<ConstructorParameters<T>[0]>

const components = new WeakMap<EffectConstructor, ExoticComponent<any> | string>()
let i = 0

const BLEND_KEYS = ['blendMode-blendFunction', 'blendMode-opacity-value']

/**
 * Registers `effect` as a JSX intrinsic once per class and returns a
 * component that renders it. Everything else - construction from `args`,
 * live prop application (with the same Color/Vector coercion and reset-
 * to-default on removal any r3f element gets), disposal - is r3f's own
 * reconciler, same rules as `<mesh>`/`<meshStandardMaterial>`. Only fits
 * effects whose constructor works with zero arguments (`new Effect()`) -
 * r3f's own reset-on-removal falls back to `0` otherwise, which is wrong
 * for anything non-numeric. Effects that require e.g. scene/camera stay
 * hand-rolled (see Outline.tsx, SelectiveBloom.tsx, ShockWave.tsx).
 *
 * `blendFunction`/`opacity` are pierced through to `blendMode-*` - every
 * `Effect` has them on a nested `blendMode`, not on the effect itself, so a
 * plain top-level prop would silently land on a stray, unread property.
 * Applied via useLiveDefaults, not as plain JSX props: BlendMode's own
 * constructor requires `blendFunction` (no default), so its constructor
 * length isn't 0 either, and r3f's native reset-on-removal falls back to
 * `changedProps[prop] = 0` - which is BlendFunction.SKIP, not a merely
 * "wrong" blend function but one that hides the effect entirely.
 */
export function createEffectComponent<T extends EffectConstructor, P extends object>(
  effect: T
): (
  props: P & {
    blendFunction?: BlendFunction
    opacity?: number
    args?: ConstructorParameters<T>
    ref?: Ref<InstanceType<T>>
  }
) => JSX.Element {
  return function EffectComponent({ blendFunction, opacity, ref, ...props }: any) {
    let Component = components.get(effect)

    if (!Component) {
      const key = `@react-three/postprocessing/${effect.name}-${i++}`
      extend({ [key]: effect })
      components.set(effect, (Component = key))
    }

    const camera = useThree((state) => state.camera)
    const localRef = useRef<InstanceType<T>>(null)
    const setRef = useMergeRefs(localRef, ref)

    useLiveDefaults(
      localRef,
      { 'blendMode-blendFunction': blendFunction, 'blendMode-opacity-value': opacity },
      BLEND_KEYS
    )

    return <Component ref={setRef} camera={camera} {...props} />
  }
}
