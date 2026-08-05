import { EffectComposer as EffectComposerImpl, LUT3DEffect } from 'postprocessing'
import * as React from 'react'
import { DataTexture } from 'three'
import { describe, expect, it } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { LUT } from '../effects/LUT'
import { flush, root, waitForComposer } from './test-utils'

describe('LUT', () => {
  it('applies tetrahedralInterpolation live, without reconstructing the effect', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<LUT3DEffect>()
    const lut = new DataTexture(new Uint8Array(4 * 4 * 4 * 4), 4, 4)

    const render = (tetrahedralInterpolation: boolean) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <LUT ref={ref} lut={lut} tetrahedralInterpolation={tetrahedralInterpolation} />
        </EffectComposer>
      )

    await React.act(async () => render(false))
    await waitForComposer(composerRef)
    await flush()
    const first = ref.current
    expect(first!.tetrahedralInterpolation).toBe(false)

    await React.act(async () => render(true))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.tetrahedralInterpolation).toBe(true)

    await React.act(async () => root.render(null))
  })

  it('applies a new lut live via its own setter, without reconstructing the effect', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<LUT3DEffect>()
    const lutA = new DataTexture(new Uint8Array(4 * 4 * 4 * 4), 4, 4)
    const lutB = new DataTexture(new Uint8Array(4 * 4 * 4 * 4), 4, 4)

    const render = (lut: DataTexture) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <LUT ref={ref} lut={lut} />
        </EffectComposer>
      )

    await React.act(async () => render(lutA))
    await waitForComposer(composerRef)
    await flush()
    const first = ref.current
    expect(first!.lut).toBe(lutA)

    await React.act(async () => render(lutB))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.lut).toBe(lutB)

    await React.act(async () => root.render(null))
  })
})
