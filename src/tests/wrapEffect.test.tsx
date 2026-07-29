import { Effect, EffectComposer as EffectComposerImpl } from 'postprocessing'
import * as React from 'react'
import { DataTexture, Texture } from 'three'
import { describe, expect, it, vi } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { wrapEffect } from '../wrapEffect'
import { flush, root } from './test-utils'

class FakeEffect extends Effect {
  value: number
  constructor({ value = 0 }: { value?: number } = {}) {
    super('FakeEffect', 'mainImage() {}')
    this.value = value
  }
}

const FakeEffectComponent = /* @__PURE__ */ wrapEffect(FakeEffect)

class CircularPropsEffect extends Effect {
  constructor(_props: Record<string, unknown> = {}) {
    super('CircularPropsEffect', 'mainImage() {}')
  }
}

const CircularPropsComponent = /* @__PURE__ */ wrapEffect(CircularPropsEffect)

describe('wrapEffect', () => {
  it('passes the constructed value through to the underlying effect instance', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <FakeEffectComponent value={42} />
        </EffectComposer>
      )
    )

    await flush()

    // @ts-expect-error
    const effect = composerRef.current!.passes[1].effects[0]

    expect(effect).toBeInstanceOf(FakeEffect)
    expect(effect.value).toBe(42)

    await React.act(async () => root.render(null))
  })

  it('registers the new instance in the same act() as the args change, not one render later', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <FakeEffectComponent value={1} />
        </EffectComposer>
      )
    )

    await flush()

    const firstEffect =
      // @ts-expect-error
      composerRef.current!.passes[1].effects[0]

    expect(firstEffect.value).toBe(1)

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <FakeEffectComponent value={2} />
        </EffectComposer>
      )
    )

    await flush()

    const secondEffect =
      // @ts-expect-error
      composerRef.current!.passes[1].effects[0]

    expect(secondEffect).not.toBe(firstEffect)
    expect(secondEffect.value).toBe(2)

    await React.act(async () => root.render(null))
  })

  it('does not crash when a prop value contains a circular reference (#333, #334)', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const circular: Record<string, unknown> = { value: 1 }
    circular.self = circular

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <CircularPropsComponent extra={circular} />
        </EffectComposer>
      )
    )

    await flush()

    // @ts-expect-error
    const effect = composerRef.current!.passes[1].effects[0]

    expect(effect).toBeInstanceOf(CircularPropsEffect)

    await React.act(async () => root.render(null))
  })

  it('fingerprints a texture prop by identity, without invoking its toJSON (perf)', async () => {
    const toJSONSpy = vi.spyOn(Texture.prototype, 'toJSON')
    const composerRef = React.createRef<EffectComposerImpl>()
    const textureA = new DataTexture(new Uint8Array(4), 1, 1)

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <CircularPropsComponent extra={textureA} />
        </EffectComposer>
      )
    )

    await flush()

    const firstEffect =
      // @ts-expect-error
      composerRef.current!.passes[1].effects[0]

    // same texture reference on re-render — should not recreate the instance
    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <CircularPropsComponent extra={textureA} />
        </EffectComposer>
      )
    )

    await flush()

    const secondEffect =
      // @ts-expect-error
      composerRef.current!.passes[1].effects[0]

    expect(secondEffect).toBe(firstEffect)

    // a genuinely different texture instance — should recreate
    const textureB = new DataTexture(new Uint8Array(4), 1, 1)

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <CircularPropsComponent extra={textureB} />
        </EffectComposer>
      )
    )

    await flush()

    const thirdEffect =
      // @ts-expect-error
      composerRef.current!.passes[1].effects[0]

    expect(thirdEffect).not.toBe(secondEffect)

    expect(toJSONSpy).not.toHaveBeenCalled()

    await React.act(async () => root.render(null))
    toJSONSpy.mockRestore()
  })

  it('does not crash on repeated re-renders once a ref is attached', async () => {
    // Regression for a bug specific to the *old* wrapEffect: it never
    // destructured `ref` out of props, so `ref` landed in `...props` and
    // JSON.stringify(props) tried to serialize `ref.current` — the mounted
    // effect instance itself — on every re-render after the first, which
    // crashed the same way #333/#334 did for texture props. Current
    // wrapEffect destructures `ref` explicitly, so it never reaches the
    // fingerprint at all; this just locks that in.
    const composerRef = React.createRef<EffectComposerImpl>()
    const effectRef = React.createRef<FakeEffect>()

    function Harness({ tick: _tick }: { tick: number }) {
      return (
        <EffectComposer ref={composerRef}>
          <FakeEffectComponent ref={effectRef} value={1} />
        </EffectComposer>
      )
    }

    await React.act(async () => root.render(<Harness tick={0} />))
    await flush()

    expect(effectRef.current).toBeInstanceOf(FakeEffect)
    const firstInstance = effectRef.current

    for (let tick = 1; tick <= 5; tick++) {
      await React.act(async () => root.render(<Harness tick={tick} />))
    }

    await flush()

    expect(effectRef.current).toBe(firstInstance)
    expect(effectRef.current).toBeInstanceOf(FakeEffect)

    await React.act(async () => root.render(null))
  })
})
