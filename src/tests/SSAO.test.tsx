import { EffectComposer as EffectComposerImpl, SSAOEffect } from 'postprocessing'
import * as React from 'react'
import { Color } from 'three'
import { describe, expect, it } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { SSAO } from '../effects/SSAO'
import { flush, root, waitForComposer } from './test-utils'

describe('SSAO', () => {
  it('resets color/fade/minRadiusScale to their constructor defaults when removed, not the first-mounted value', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<SSAOEffect>()

    const render = (withOverrides: boolean) =>
      root.render(
        <EffectComposer ref={composerRef} enableNormalPass>
          <SSAO ref={ref} {...(withOverrides ? { color: new Color('red'), fade: 0.5, minRadiusScale: 0.9 } : {})} />
        </EffectComposer>
      )

    await React.act(async () => render(true))
    await waitForComposer(composerRef)
    await flush()

    expect(ref.current!.color!.getHexString()).toBe('ff0000')
    expect(ref.current!.ssaoMaterial.fade).toBeCloseTo(0.5)
    expect(ref.current!.ssaoMaterial.minRadiusScale).toBeCloseTo(0.9)

    await React.act(async () => render(false))
    await flush()

    // SSAOEffect's own constructor defaults (null / 0.01 / 0.1), not the
    // values from the first render this instance ever saw.
    expect(ref.current!.color).toBeNull()
    expect(ref.current!.ssaoMaterial.fade).toBeCloseTo(0.01)
    expect(ref.current!.ssaoMaterial.minRadiusScale).toBeCloseTo(0.1)
  })

  it('applies intensity live, without reconstructing the effect', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<SSAOEffect>()

    const render = (intensity: number) =>
      root.render(
        <EffectComposer ref={composerRef} enableNormalPass>
          <SSAO ref={ref} intensity={intensity} />
        </EffectComposer>
      )

    await React.act(async () => render(1))
    await waitForComposer(composerRef)
    await flush()
    const first = ref.current
    expect(first!.intensity).toBe(1)

    await React.act(async () => render(2))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.intensity).toBe(2)

    await React.act(async () => root.render(null))
  })

  it('applies bias live via the nested ssaoMaterial, without reconstructing the effect', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<SSAOEffect>()

    const render = (bias: number) =>
      root.render(
        <EffectComposer ref={composerRef} enableNormalPass>
          <SSAO ref={ref} bias={bias} />
        </EffectComposer>
      )

    await React.act(async () => render(0.5))
    await waitForComposer(composerRef)
    await flush()
    const first = ref.current
    expect(first!.ssaoMaterial.bias).toBeCloseTo(0.5)

    await React.act(async () => render(0.8))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.ssaoMaterial.bias).toBeCloseTo(0.8)

    await React.act(async () => root.render(null))
  })

  it('applies worldProximityThreshold live via the nested ssaoMaterial, without reconstructing the effect', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<SSAOEffect>()

    const render = (worldProximityThreshold: number) =>
      root.render(
        <EffectComposer ref={composerRef} enableNormalPass>
          <SSAO ref={ref} worldProximityThreshold={worldProximityThreshold} />
        </EffectComposer>
      )

    await React.act(async () => render(0.5))
    await waitForComposer(composerRef)
    await flush()
    const first = ref.current
    expect(first!.ssaoMaterial.worldProximityThreshold).toBeCloseTo(0.5)

    await React.act(async () => render(0.8))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.ssaoMaterial.worldProximityThreshold).toBeCloseTo(0.8)

    await React.act(async () => root.render(null))
  })

  it('still reconstructs when resolutionScale (construction-only) changes', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<SSAOEffect>()

    const render = (resolutionScale: number) =>
      root.render(
        <EffectComposer ref={composerRef} enableNormalPass>
          <SSAO ref={ref} resolutionScale={resolutionScale} />
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
