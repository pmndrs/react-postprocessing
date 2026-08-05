import { DepthOfFieldEffect, EffectComposer as EffectComposerImpl } from 'postprocessing'
import * as React from 'react'
import { Texture } from 'three'
import { describe, expect, it } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { DepthOfField } from '../effects/DepthOfField'
import { flush, root, waitForComposer } from './test-utils'

describe('DepthOfField', () => {
  it('applies bokehScale live, without reconstructing the effect', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<DepthOfFieldEffect>()

    const render = (bokehScale: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <DepthOfField ref={ref} bokehScale={bokehScale} />
        </EffectComposer>
      )

    await React.act(async () => render(1))
    await waitForComposer(composerRef)
    await flush()
    const first = ref.current
    expect(first!.bokehScale).toBe(1)

    await React.act(async () => render(2))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.bokehScale).toBe(2)

    await React.act(async () => root.render(null))
  })

  it('applies focusDistance live via the nested cocMaterial, without reconstructing the effect', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<DepthOfFieldEffect>()

    const render = (focusDistance: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <DepthOfField ref={ref} focusDistance={focusDistance} />
        </EffectComposer>
      )

    await React.act(async () => render(0.1))
    await waitForComposer(composerRef)
    await flush()
    const first = ref.current
    expect(first!.cocMaterial.focusDistance).toBeCloseTo(0.1)

    await React.act(async () => render(0.5))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.cocMaterial.focusDistance).toBeCloseTo(0.5)

    await React.act(async () => root.render(null))
  })

  it('applies depthTexture live via setDepthTexture, without reconstructing, and resets on removal', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<DepthOfFieldEffect>()
    const textureA = new Texture()
    const textureB = new Texture()
    // cocMaterial.depthBuffer is write-only in postprocessing (setter, no
    // getter) - the current value only reads back through its own uniform.
    const currentDepthBuffer = () =>
      (ref.current!.cocMaterial as unknown as { uniforms: { depthBuffer: { value: unknown } } }).uniforms.depthBuffer
        .value

    const render = (depthTexture?: { texture: Texture; packing: number }) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <DepthOfField ref={ref} depthTexture={depthTexture} />
        </EffectComposer>
      )

    await React.act(async () => render())
    await waitForComposer(composerRef)
    await flush()
    const first = ref.current

    await React.act(async () => render({ texture: textureA, packing: 0 }))
    await flush()
    expect(ref.current).toBe(first)
    expect(currentDepthBuffer()).toBe(textureA)

    await React.act(async () => render({ texture: textureB, packing: 0 }))
    await flush()
    expect(ref.current).toBe(first)
    expect(currentDepthBuffer()).toBe(textureB)

    await React.act(async () => render())
    await flush()
    expect(ref.current).toBe(first)
    // Reverts to no manually-provided depth texture (undefined), the state
    // useLiveDefaults captured as this instance's default on first apply -
    // not whatever EffectComposer's own depth-attribute auto-wiring later
    // assigns, which runs separately and after this.
    expect(currentDepthBuffer()).toBeUndefined()

    await React.act(async () => root.render(null))
  })

  it('still reconstructs when resolutionScale (construction-only) changes', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<DepthOfFieldEffect>()

    const render = (resolutionScale: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <DepthOfField ref={ref} resolutionScale={resolutionScale} />
        </EffectComposer>
      )

    await React.act(async () => render(0.5))
    await waitForComposer(composerRef)
    await flush()
    const first = ref.current

    await React.act(async () => render(1))
    await flush()

    expect(ref.current).not.toBe(first)

    await React.act(async () => root.render(null))
  })
})
