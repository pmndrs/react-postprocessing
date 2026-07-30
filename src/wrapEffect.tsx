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

const identityTokens = new WeakMap<object, number>()
let nextIdentityToken = 0

// Same object in, same token out — lets otherwise-opaque values (textures,
// refs, any class instance) still change the fingerprint when swapped for
// a different instance, without walking into them.
function identityOf(value: object): number {
  let token = identityTokens.get(value)
  if (token === undefined) {
    token = nextIdentityToken++
    identityTokens.set(value, token)
  }
  return token
}

// Walks props into a JSON-safe fingerprint for the args memo below. Two
// things JSON.stringify can't be trusted with here:
//  - it throws on cycles (refs, or any three.js object with a back-
//    reference), so cycles are cut off with a WeakSet guard instead.
//  - it calls a value's own toJSON first if present, which for e.g.
//    THREE.Texture re-encodes the whole image to a base64 data URL on
//    every single render (measured ~39ms for a 512x512 texture) just to
//    throw the result away. Reading properties directly sidesteps that.
//  - reading properties directly instead means typed arrays need their
//    own case: Object.keys() on one returns every numeric index, so
//    walking a texture's backing buffer element-by-element is even
//    slower (~340ms for the same texture) than the toJSON it replaces.
//    Identity is enough — same buffer means unchanged.
function fingerprint(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || typeof value !== 'object') return value
  if (seen.has(value)) return '[Circular]'

  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
    return identityOf(value)
  }

  seen.add(value)

  if (Array.isArray(value)) {
    return value.map((item) => fingerprint(item, seen))
  }

  const out: Record<string, unknown> = {}
  for (const key of Object.keys(value).sort()) {
    out[key] = fingerprint((value as Record<string, unknown>)[key], seen)
  }
  return out
}

function stableStringify(value: unknown): string {
  return JSON.stringify(fingerprint(value, new WeakSet()))
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
