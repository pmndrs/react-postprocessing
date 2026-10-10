import { EffectAttribute } from 'postprocessing'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { Sharpness, SharpnessEffect } from '../effects/Sharpness'
import { flush, root } from './test-utils'

describe('Sharpness', () => {
  it('is a convolution effect, so it reads unprocessed neighbors', () => {
    const effect = new SharpnessEffect()
    expect(effect.getAttributes() & EffectAttribute.CONVOLUTION).toBe(EffectAttribute.CONVOLUTION)
    effect.dispose()
  })

  it('applies sharpness and radius live, without reconstructing the effect', async () => {
    const ref = React.createRef<SharpnessEffect>()

    const render = (sharpness: number, radius: number) =>
      root.render(
        <EffectComposer>
          <Sharpness ref={ref} sharpness={sharpness} radius={radius} />
        </EffectComposer>
      )

    await React.act(async () => render(0.5, 1))
    await flush()
    const first = ref.current

    await React.act(async () => render(2, 3))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.uniforms.get('sharpness')!.value).toBe(2)
    expect(ref.current!.uniforms.get('radius')!.value).toBe(3)

    await React.act(async () => root.render(null))
  })

  it('resets sharpness to its default when the prop is removed', async () => {
    const ref = React.createRef<SharpnessEffect>()

    await React.act(async () =>
      root.render(
        <EffectComposer>
          <Sharpness ref={ref} sharpness={3} />
        </EffectComposer>
      )
    )
    await flush()

    await React.act(async () =>
      root.render(
        <EffectComposer>
          <Sharpness ref={ref} />
        </EffectComposer>
      )
    )
    await flush()

    expect(ref.current!.sharpness).toBe(1)

    await React.act(async () => root.render(null))
  })
})
