import * as React from 'react'
import * as THREE from 'three'
import { describe, it, expect } from 'vitest'
import { extend, createRoot, act } from '@react-three/fiber'
import { ChromaticAberrationEffect } from 'postprocessing'
import { EffectComposer } from '../EffectComposer'
import { ChromaticAberration } from './ChromaticAberration'

// Let React know that we'll be testing effectful components
declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
global.IS_REACT_ACT_ENVIRONMENT = true

// Create virtual R3F root for testing
extend(THREE as any)
const root = createRoot({
  style: {} as CSSStyleDeclaration,
  addEventListener: (() => {}) as any,
  removeEventListener: (() => {}) as any,
  width: 1280,
  height: 800,
  clientWidth: 1280,
  clientHeight: 800,
  getContext: (() =>
    new Proxy(
      {},
      {
        get(_target, prop) {
          switch (prop) {
            case 'getParameter':
              return () => 'WebGL 2' // GL_VERSION
            case 'getExtension':
              return () => ({}) // EXT_blend_minmax
            case 'getContextAttributes':
              return () => ({ alpha: true })
            case 'getShaderPrecisionFormat':
              return () => ({ rangeMin: 1, rangeMax: 1, precision: 1 })
            default:
              return () => {}
          }
        },
      }
    )) as any,
} satisfies Partial<HTMLCanvasElement> as HTMLCanvasElement)
root.configure({ frameloop: 'never' })

describe('ChromaticAberration', () => {
  it('coerces a tuple offset to a Vector2 so the imperative API works', async () => {
    const ref = React.createRef<ChromaticAberrationEffect>()

    await act(async () =>
      root.render(
        <EffectComposer>
          <ChromaticAberration ref={ref} offset={[0.001, 0.0005]} />
        </EffectComposer>
      )
    )

    const effect = ref.current!
    expect(effect).toBeInstanceOf(ChromaticAberrationEffect)
    expect(effect.offset).toBeInstanceOf(THREE.Vector2)
    expect(effect.offset.x).toBe(0.001)
    expect(effect.offset.y).toBe(0.0005)
    // The pattern from the docs/examples that used to throw "offset.set is not a function"
    expect(() => effect.offset.set(0.002, 0.001)).not.toThrow()
    expect(effect.offset.x).toBe(0.002)
  })

  it('keeps the effect default when no offset is passed', async () => {
    const ref = React.createRef<ChromaticAberrationEffect>()

    await act(async () =>
      root.render(
        <EffectComposer>
          <ChromaticAberration ref={ref} />
        </EffectComposer>
      )
    )

    const effect = ref.current!
    const fallback = new ChromaticAberrationEffect()
    expect(effect.offset).toBeInstanceOf(THREE.Vector2)
    expect(effect.offset.x).toBe(fallback.offset.x)
    expect(effect.offset.y).toBe(fallback.offset.y)
  })
})
