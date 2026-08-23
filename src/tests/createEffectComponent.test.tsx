import { Effect, EffectComposer as EffectComposerImpl } from 'postprocessing'
import * as React from 'react'
import { Uniform } from 'three'
import { describe, expect, it, vi } from 'vitest'
import { createEffectComponent } from '../createEffectComponent'
import { EffectComposer } from '../EffectComposer'
import { flush, root } from './test-utils'

// Zero-arity, real accessor - the class of effect createEffectComponent
// targets. Matches BloomEffect's shape: `constructor({...} = {})`.
class FakeEffect extends Effect {
  private _value: number
  constructor({ value = 0 }: { value?: number } = {}) {
    super('FakeEffect', 'mainImage() {}')
    this._value = value
  }
  get value() {
    return this._value
  }
  set value(v: number) {
    this._value = v
  }
}

const FakeEffectComponent = /* @__PURE__ */ createEffectComponent<typeof FakeEffect, { value?: number }>(FakeEffect)

// Options stored only in `uniforms` (mirrors WaterEffectImpl/RampEffect
// before this branch gave them real accessors) - `factor` here HAS a real
// accessor, proving that's what makes a plain JSX prop actually reach it.
class UniformFixtureEffect extends Effect {
  constructor({ factor = 0 }: { factor?: number } = {}) {
    super('UniformFixtureEffect', 'mainImage() {}', { uniforms: new Map([['factor', new Uniform(factor)]]) })
  }
  get factor(): number {
    return this.uniforms.get('factor')!.value
  }
  set factor(v: number) {
    this.uniforms.get('factor')!.value = v
  }
}

const UniformFixtureComponent = /* @__PURE__ */ createEffectComponent<typeof UniformFixtureEffect, { factor?: number }>(
  UniformFixtureEffect
)

describe('createEffectComponent', () => {
  it('constructs the effect and passes props through to the instance', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <FakeEffectComponent value={42} />
        </EffectComposer>
      )
    )

    await flush()

    // @ts-expect-error - `effects` isn't part of the public Pass typing
    const effect = composerRef.current!.passes[1].effects[0]

    expect(effect).toBeInstanceOf(FakeEffect)
    expect(effect.value).toBe(42)

    await React.act(async () => root.render(null))
  })

  it('applies a live prop without reconstructing the instance (r3f-native, no args change)', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<FakeEffect>()

    const render = (value: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <FakeEffectComponent ref={ref} value={value} />
        </EffectComposer>
      )

    await React.act(async () => render(1))
    await flush()
    const first = ref.current
    expect(first!.value).toBe(1)

    await React.act(async () => render(2))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.value).toBe(2)

    await React.act(async () => root.render(null))
  })

  it('resets a live prop to its constructor default when removed (r3f-native diffProps)', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<FakeEffect>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <FakeEffectComponent ref={ref} value={5} />
        </EffectComposer>
      )
    )
    await flush()
    expect(ref.current!.value).toBe(5)

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <FakeEffectComponent ref={ref} />
        </EffectComposer>
      )
    )
    await flush()

    expect(ref.current!.value).toBe(0)

    await React.act(async () => root.render(null))
  })

  it('reconstructs when an explicit args prop changes, same as any other r3f element', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<FakeEffect>()

    const render = (value: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <FakeEffectComponent ref={ref} args={[{ value }]} />
        </EffectComposer>
      )

    await React.act(async () => render(1))
    await flush()
    const first = ref.current
    expect(first!.value).toBe(1)

    await React.act(async () => render(2))
    await flush()

    expect(ref.current).not.toBe(first)
    expect(ref.current!.value).toBe(2)

    await React.act(async () => root.render(null))
  })

  it('applies blendFunction/opacity through blendMode, not as a stray top-level property', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<FakeEffect>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <FakeEffectComponent ref={ref} blendFunction={7 as never} opacity={0.5} />
        </EffectComposer>
      )
    )
    await flush()

    expect(ref.current!.blendMode.blendFunction).toBe(7)
    expect(ref.current!.blendMode.opacity.value).toBe(0.5)
    expect((ref.current as unknown as { blendFunction?: unknown }).blendFunction).toBeUndefined()

    await React.act(async () => root.render(null))
  })

  it('resets blendFunction/opacity to blendMode\'s own defaults when the props are removed', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<FakeEffect>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <FakeEffectComponent ref={ref} />
        </EffectComposer>
      )
    )
    await flush()
    const defaultBlendFunction = ref.current!.blendMode.blendFunction
    const defaultOpacity = ref.current!.blendMode.opacity.value

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <FakeEffectComponent ref={ref} blendFunction={7 as never} opacity={0.5} />
        </EffectComposer>
      )
    )
    await flush()
    expect(ref.current!.blendMode.blendFunction).toBe(7)
    expect(ref.current!.blendMode.opacity.value).toBe(0.5)

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <FakeEffectComponent ref={ref} />
        </EffectComposer>
      )
    )
    await flush()

    expect(ref.current!.blendMode.blendFunction).toBe(defaultBlendFunction)
    expect(ref.current!.blendMode.opacity.value).toBe(defaultOpacity)

    await React.act(async () => root.render(null))
  })

  it('updates a uniforms-Map-backed prop live via its accessor, without reconstructing', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<UniformFixtureEffect>()

    const render = (factor: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <UniformFixtureComponent ref={ref} factor={factor} />
        </EffectComposer>
      )

    await React.act(async () => render(1))
    await flush()
    const first = ref.current
    expect(first!.uniforms.get('factor')!.value).toBe(1)

    await React.act(async () => render(2))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.uniforms.get('factor')!.value).toBe(2)

    await React.act(async () => root.render(null))
  })

  it('disposes the instance on unmount', async () => {
    const disposeSpy = vi.spyOn(FakeEffect.prototype, 'dispose')
    const composerRef = React.createRef<EffectComposerImpl>()

    try {
      await React.act(async () =>
        root.render(
          <EffectComposer ref={composerRef}>
            <FakeEffectComponent value={1} />
          </EffectComposer>
        )
      )
      await flush()

      await React.act(async () => root.render(null))

      expect(disposeSpy).toHaveBeenCalledTimes(1)
    } finally {
      disposeSpy.mockRestore()
    }
  })

  it('forwards a callback ref\'s own returned cleanup (React 19 ref cleanup), instead of dropping it', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const events: string[] = []
    const cleanup = vi.fn(() => {
      events.push('cleanup')
    })
    const callbackRef = vi.fn((instance: FakeEffect | null) => {
      events.push(instance ? 'attach' : 'attach-null')
      if (instance) return cleanup
    })

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <FakeEffectComponent ref={callbackRef} value={1} />
        </EffectComposer>
      )
    )
    await flush()

    expect(callbackRef).toHaveBeenCalledTimes(1)
    expect(cleanup).not.toHaveBeenCalled()

    await React.act(async () => root.render(null))

    // React 19 ref-cleanup semantics: once a cleanup is returned, it's
    // called directly - the callback itself is never re-invoked with null.
    expect(cleanup).toHaveBeenCalledTimes(1)
    expect(callbackRef).toHaveBeenCalledTimes(1)
    expect(events).toEqual(['attach', 'cleanup'])
  })
})
