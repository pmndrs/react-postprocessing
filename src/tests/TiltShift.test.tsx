import { EffectComposer as EffectComposerImpl, TiltShiftEffect } from 'postprocessing'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { TiltShift } from '../effects/TiltShift'
import { flush, root } from './test-utils'

describe('TiltShift', () => {
  it('applies resolutionScale at construction (previously never reached the effect at all)', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<TiltShiftEffect>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <TiltShift ref={ref} resolutionScale={0.25} />
        </EffectComposer>
      )
    )

    await flush()

    expect(ref.current!.blurPass.resolution.scale).toBeCloseTo(0.25)

    await React.act(async () => root.render(null))
  })

  it('reconstructs when resolutionScale (construction-only) changes', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<TiltShiftEffect>()

    const render = (resolutionScale: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <TiltShift ref={ref} resolutionScale={resolutionScale} />
        </EffectComposer>
      )

    await React.act(async () => render(0.25))
    await flush()
    const first = ref.current

    await React.act(async () => render(0.5))
    await flush()

    expect(ref.current).not.toBe(first)
    expect(ref.current!.blurPass.resolution.scale).toBeCloseTo(0.5)

    await React.act(async () => root.render(null))
  })

  it('applies offset live, without reconstructing the effect', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<TiltShiftEffect>()

    const render = (offset: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <TiltShift ref={ref} offset={offset} />
        </EffectComposer>
      )

    await React.act(async () => render(0.1))
    await flush()
    const first = ref.current
    expect(first!.offset).toBeCloseTo(0.1)

    await React.act(async () => render(0.2))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.offset).toBeCloseTo(0.2)

    await React.act(async () => root.render(null))
  })
})
