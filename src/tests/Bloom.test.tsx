import { BloomEffect, EffectComposer as EffectComposerImpl } from 'postprocessing'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { Bloom } from '../effects/Bloom'
import { flush, root } from './test-utils'

describe('Bloom', () => {
  it('applies intensity live, without reconstructing the effect', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<BloomEffect>()

    const render = (intensity: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <Bloom ref={ref} intensity={intensity} />
        </EffectComposer>
      )

    await React.act(async () => render(1))
    await flush()
    const first = ref.current
    expect(first!.intensity).toBe(1)

    await React.act(async () => render(2))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.intensity).toBe(2)

    await React.act(async () => root.render(null))
  })

  it('applies mipmapBlur (a construction-only option) as a plain prop, reconstructing under the hood', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<BloomEffect>()

    const render = (mipmapBlur: boolean) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <Bloom ref={ref} mipmapBlur={mipmapBlur} />
        </EffectComposer>
      )

    await React.act(async () => render(true))
    await flush()
    const first = ref.current
    expect(first!.mipmapBlurPass.enabled).toBe(true)

    await React.act(async () => render(false))
    await flush()

    expect(ref.current).not.toBe(first)
    expect(ref.current!.mipmapBlurPass.enabled).toBe(false)

    await React.act(async () => root.render(null))
  })

  it('accepts opacity, as documented in the README (#opacity narrower than createEffectComponent allows)', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<BloomEffect>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <Bloom ref={ref} opacity={0.02} />
        </EffectComposer>
      )
    )
    await flush()

    expect(ref.current!.blendMode.opacity.value).toBe(0.02)

    await React.act(async () => root.render(null))
  })
})
