import { createRoot, extend } from '@react-three/fiber'
import { EffectComposer as EffectComposerImpl, EffectPass } from 'postprocessing'
import * as React from 'react'
import * as THREE from 'three'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true

extend(THREE as any)

export const root = createRoot({
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
              return () => 'WebGL 2'
            case 'getExtension':
              return () => ({})
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

export const EFFECT_SHADER = `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  outputColor = inputColor;
}
`

export const flush = async () => {
  await React.act(async () => {
    await Promise.resolve()
  })
}

export const strict = (children: React.ReactNode) => <React.StrictMode>{children}</React.StrictMode>

export const waitForComposer = async (ref: React.RefObject<EffectComposerImpl | null>): Promise<EffectComposerImpl> => {
  for (let i = 0; i < 50; i++) {
    await flush()
    if (ref.current) return ref.current
  }
  throw new Error('Composer was not created')
}

export const waitForNewComposer = async (
  ref: React.RefObject<EffectComposerImpl | null>,
  previous: EffectComposerImpl
): Promise<EffectComposerImpl> => {
  for (let i = 0; i < 50; i++) {
    await flush()
    if (ref.current && ref.current !== previous) return ref.current
  }
  throw new Error('Composer was not recreated')
}

export const waitForEffects = async (ref: React.RefObject<EffectComposerImpl | null>, count: number) => {
  for (let i = 0; i < 50; i++) {
    await flush()

    const pass = ref.current?.passes.find(
      (p): p is EffectPass =>
        // @ts-expect-error - `effects` isn't part of the public Pass typing
        p instanceof EffectPass && p.effects.length === count
    )

    if (pass) {
      // @ts-expect-error
      return pass.effects
    }
  }

  throw new Error(`Expected EffectPass with ${count} effects`)
}
