import { ChromaticAberrationEffect } from 'postprocessing'
import { Ref, forwardRef } from 'react'
import { type ReactThreeFiber } from '@react-three/fiber'
import { type EffectProps, useVector2, wrapEffect } from '../util'

export type ChromaticAberrationProps = EffectProps<typeof ChromaticAberrationEffect> & {
  offset?: ReactThreeFiber.Vector2
}

const ChromaticAberrationImpl = /* @__PURE__ */ wrapEffect(ChromaticAberrationEffect)

export const ChromaticAberration = /* @__PURE__ */ forwardRef<ChromaticAberrationEffect, ChromaticAberrationProps>(
  function ChromaticAberration(props: ChromaticAberrationProps, ref: Ref<ChromaticAberrationEffect>) {
    // Coerce number/tuple offsets to a Vector2 before they reach the effect
    // constructor, which stores whatever it is given into a Uniform (same
    // pattern as Glitch.tsx). Without this, `offset={[x, y]}` type-checks
    // but leaves `effect.offset` as a plain array, so the imperative API
    // (`ref.current.offset.set(...)`) throws.
    const offset = useVector2(props, 'offset')
    return <ChromaticAberrationImpl ref={ref} {...props} offset={props.offset !== undefined ? offset : undefined} />
  }
)
