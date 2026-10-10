import { EffectAttribute } from 'postprocessing'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { Halftone, HalftoneEffect, HalftoneShape } from '../effects/Halftone'
import { flush, root } from './test-utils'

describe('Halftone', () => {
  it('is a convolution effect, so it reads unprocessed neighbors', () => {
    const effect = new HalftoneEffect()
    expect(effect.getAttributes() & EffectAttribute.CONVOLUTION).toBe(EffectAttribute.CONVOLUTION)
    effect.dispose()
  })

  it('applies props live, without reconstructing the effect', async () => {
    const ref = React.createRef<HalftoneEffect>()

    const render = (shape: HalftoneShape, radius: number, greyscale: boolean) =>
      root.render(
        <EffectComposer>
          <Halftone ref={ref} shape={shape} radius={radius} greyscale={greyscale} rotateR={radius} />
        </EffectComposer>
      )

    await React.act(async () => render(HalftoneShape.Dot, 4, false))
    await flush()
    const first = ref.current

    await React.act(async () => render(HalftoneShape.Square, 8, true))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.uniforms.get('shape')!.value).toBe(HalftoneShape.Square)
    expect(ref.current!.uniforms.get('radius')!.value).toBe(8)
    expect(ref.current!.uniforms.get('greyscale')!.value).toBe(true)
    expect(ref.current!.uniforms.get('rotateR')!.value).toBe(8)

    await React.act(async () => root.render(null))
  })

  it('resets props to their defaults when removed', async () => {
    const ref = React.createRef<HalftoneEffect>()

    await React.act(async () =>
      root.render(
        <EffectComposer>
          <Halftone ref={ref} shape={HalftoneShape.Line} rotateG={1} />
        </EffectComposer>
      )
    )
    await flush()

    await React.act(async () =>
      root.render(
        <EffectComposer>
          <Halftone ref={ref} />
        </EffectComposer>
      )
    )
    await flush()

    expect(ref.current!.shape).toBe(HalftoneShape.Dot)
    expect(ref.current!.rotateG).toBeCloseTo((Math.PI / 12) * 2)

    await React.act(async () => root.render(null))
  })
})
