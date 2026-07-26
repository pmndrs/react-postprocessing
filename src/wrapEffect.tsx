import { extend, useThree } from '@react-three/fiber'
import type { BlendFunction, Effect, Pass } from 'postprocessing'
import { useMemo, type ExoticComponent, type JSX, type Ref } from 'react'

export type EffectConstructor = new (...args: any[]) => Effect | Pass

// Handles three ConstructorParameters<T> shapes: required first param
// (P), optional first param (Partial<P> — some effects in postprocessing
// type inner fields as required even though the whole object is
// omittable), and no params at all ({})
type FirstConstructorParam<T extends EffectConstructor> =
  ConstructorParameters<T> extends [infer P, ...any[]]
    ? P
    : ConstructorParameters<T> extends [(infer P)?, ...any[]]
      ? Partial<P>
      : {}

export type EffectProps<T extends EffectConstructor> = FirstConstructorParam<T> & {
  ref?: Ref<InstanceType<T>>
  blendFunction?: BlendFunction
  opacity?: number
  args?: ConstructorParameters<T>
}

let i = 0

const components = new WeakMap<EffectConstructor, ExoticComponent<any> | string>()

// Some prop values (textures, refs, other three.js objects with back-
// references) form cycles that JSON.stringify can't walk on its own —
// it throws "Converting circular structure to JSON". This is only used
// as a memo fingerprint, not real serialization, so breaking a cycle
// with a placeholder is enough to keep it from crashing.
function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>()
  return JSON.stringify(value, (_key, val) => {
    if (typeof val === 'object' && val !== null) {
      if (seen.has(val)) return '[Circular]'
      seen.add(val)
    }
    return val
  })
}

export function wrapEffect<T extends EffectConstructor>(
  effect: T,
  defaults?: EffectProps<T>
): (props: EffectProps<T>) => JSX.Element {
  return function WrappedEffect({
    ref,
    blendFunction = defaults?.blendFunction,
    opacity = defaults?.opacity,
    ...props
  }) {
    let Component = components.get(effect)

    if (!Component) {
      const key = `@react-three/postprocessing/${effect.name}-${i++}`
      extend({ [key]: effect })
      components.set(effect, (Component = key))
    }

    const camera = useThree((state) => state.camera)

    const args = useMemo(
      () => [
        ...((defaults?.args as unknown as any[]) ?? []),
        ...((props.args as unknown as any[]) ?? [{ ...defaults, ...props }]),
      ],
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [stableStringify(props)]
    )

    return (
      <Component
        camera={camera}
        blendMode-blendFunction={blendFunction}
        blendMode-opacity-value={opacity}
        {...props}
        args={args}
        ref={ref}
      />
    )
  }
}
