import { ChromaticAberrationEffect, EffectComposer as EffectComposerImpl } from 'postprocessing'
import * as React from 'react'
import { Vector2 } from 'three'
import { describe, expect, it } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { ChromaticAberration } from '../effects/ChromaticAberration'
import { flush, root } from './test-utils'

describe('ChromaticAberration', () => {
  it('coerces a tuple offset into a real Vector2 (#348)', async () => {
    const ref = React.createRef<ChromaticAberrationEffect>()
    const composerRef = React.createRef<EffectComposerImpl>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <ChromaticAberration ref={ref} offset={[0.001, 0.0005]} />
        </EffectComposer>
      )
    )

    await flush()

    expect(ref.current!.offset).toBeInstanceOf(Vector2)
    expect(() => ref.current!.offset.set(0.002, 0.001)).not.toThrow()
    expect(ref.current!.offset.x).toBeCloseTo(0.002)
    expect(ref.current!.offset.y).toBeCloseTo(0.001)

    await React.act(async () => root.render(null))
  })

  it('applies offset live without reconstructing the effect', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<ChromaticAberrationEffect>()

    const render = (x: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <ChromaticAberration ref={ref} offset={[x, 0.001]} />
        </EffectComposer>
      )

    await React.act(async () => render(0.01))
    await flush()
    const first = ref.current
    expect(first!.offset.x).toBeCloseTo(0.01)

    await React.act(async () => render(0.02))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.offset.x).toBeCloseTo(0.02)

    await React.act(async () => root.render(null))
  })

  it('applies radialModulation live, without reconstructing the effect', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<ChromaticAberrationEffect>()

    const render = (radialModulation: boolean) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <ChromaticAberration ref={ref} radialModulation={radialModulation} />
        </EffectComposer>
      )

    await React.act(async () => render(false))
    await flush()
    const first = ref.current
    expect(first!.radialModulation).toBe(false)

    await React.act(async () => render(true))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.radialModulation).toBe(true)

    await React.act(async () => root.render(null))
  })
})
