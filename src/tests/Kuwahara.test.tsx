import { EffectAttribute } from 'postprocessing'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { Kuwahara, KuwaharaEffect } from '../effects/Kuwahara'
import { flush, root } from './test-utils'

describe('Kuwahara', () => {
  it('is a convolution effect, so it reads unprocessed neighbors', () => {
    const effect = new KuwaharaEffect()
    expect(effect.getAttributes() & EffectAttribute.CONVOLUTION).toBe(EffectAttribute.CONVOLUTION)
    effect.dispose()
  })

  it('applies radius and sectorCount live, without reconstructing the effect', async () => {
    const ref = React.createRef<KuwaharaEffect>()

    const render = (radius: number, sectorCount: number) =>
      root.render(
        <EffectComposer>
          <Kuwahara ref={ref} radius={radius} sectorCount={sectorCount} />
        </EffectComposer>
      )

    await React.act(async () => render(2, 4))
    await flush()
    const first = ref.current
    expect(first!.radius).toBe(2)
    expect(first!.sectorCount).toBe(4)

    await React.act(async () => render(6, 8))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.uniforms.get('radius')!.value).toBe(6)
    expect(ref.current!.uniforms.get('sectorCount')!.value).toBe(8)

    await React.act(async () => root.render(null))
  })

  it('resets radius to its default when the prop is removed', async () => {
    const ref = React.createRef<KuwaharaEffect>()

    await React.act(async () =>
      root.render(
        <EffectComposer>
          <Kuwahara ref={ref} radius={10} />
        </EffectComposer>
      )
    )
    await flush()

    await React.act(async () =>
      root.render(
        <EffectComposer>
          <Kuwahara ref={ref} />
        </EffectComposer>
      )
    )
    await flush()

    expect(ref.current!.radius).toBe(4)

    await React.act(async () => root.render(null))
  })
})
