import * as React from 'react'
import * as THREE from 'three'
import { vi, describe, it, expect } from 'vitest'
import { extend, createRoot, act } from '@react-three/fiber'
import { EffectComposer } from './EffectComposer'
import { EffectComposer as EffectComposerImpl, RenderPass, Pass, Effect, EffectPass } from 'postprocessing'

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

const EFFECT_SHADER = 'mainImage() {}'

describe('EffectComposer', () => {
  it('should merge effects together', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()

    const effectA = new Effect('A', EFFECT_SHADER)
    const effectB = new Effect('B', EFFECT_SHADER)
    const effectC = new Effect('C', EFFECT_SHADER)
    const passA = new Pass()
    const passB = new Pass()

    // Forward order
    await act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          {/* EffectPass(effectA, effectB) */}
          <primitive object={effectA} />
          <primitive object={effectB} />
          {/* PassA */}
          <primitive object={passA} />
          {/* EffectPass(effectC) */}
          <primitive object={effectC} />
          {/* PassB */}
          <primitive object={passB} />
        </EffectComposer>
      )
    )
    expect(composerRef.current!.passes.map((p) => p.constructor)).toStrictEqual([
      RenderPass,
      EffectPass,
      Pass,
      EffectPass,
      Pass,
    ])
    // @ts-expect-error
    expect((composerRef.current!.passes[1] as EffectPass).effects).toStrictEqual([effectA, effectB])
    expect(composerRef.current!.passes[2]).toBe(passA)
    // @ts-expect-error
    expect((composerRef.current!.passes[3] as EffectPass).effects).toStrictEqual([effectC])
    expect(composerRef.current!.passes[4]).toBe(passB)

    // NOTE: instance children ordering is unstable until R3F v9, so we remount from scratch
    await act(async () => root.render(null))

    // Reverse order
    await act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          {/* PassB */}
          <primitive object={passB} />
          {/* EffectPass(effectC) */}
          <primitive object={effectC} />
          {/* PassA */}
          <primitive object={passA} />
          {/* EffectPass(effectB, effectA) */}
          <primitive object={effectB} />
          <primitive object={effectA} />
        </EffectComposer>
      )
    )
    expect(composerRef.current!.passes.map((p) => p.constructor)).toStrictEqual([
      RenderPass,
      Pass,
      EffectPass,
      Pass,
      EffectPass,
    ])
    expect(composerRef.current!.passes[1]).toBe(passB)
    // @ts-expect-error
    expect((composerRef.current!.passes[2] as EffectPass).effects).toStrictEqual([effectC])
    expect(composerRef.current!.passes[3]).toBe(passA)
    // @ts-expect-error
    expect((composerRef.current!.passes[4] as EffectPass).effects).toStrictEqual([effectB, effectA])
  })

  it.skip('should split convolution effects', async () => {
    await act(async () => root.render(null))
  })
})
