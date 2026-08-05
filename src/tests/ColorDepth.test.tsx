import { ColorDepthEffect, EffectComposer as EffectComposerImpl } from 'postprocessing'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { ColorDepth } from '../effects/ColorDepth'
import { EffectComposer } from '../EffectComposer'
import { flush, root } from './test-utils'

describe('ColorDepth', () => {
  it('applies bits live via the differently-named bitDepth setter, without reconstructing the effect', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<ColorDepthEffect>()

    const render = (bits: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <ColorDepth ref={ref} bits={bits} />
        </EffectComposer>
      )

    await React.act(async () => render(4))
    await flush()
    const first = ref.current
    expect(first!.bitDepth).toBe(4)

    await React.act(async () => render(8))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.bitDepth).toBe(8)

    await React.act(async () => root.render(null))
  })

  it('resets bitDepth to its constructor default when bits is removed', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<ColorDepthEffect>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <ColorDepth ref={ref} />
        </EffectComposer>
      )
    )
    await flush()
    const defaultBitDepth = ref.current!.bitDepth

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <ColorDepth ref={ref} bits={4} />
        </EffectComposer>
      )
    )
    await flush()
    expect(ref.current!.bitDepth).toBe(4)

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <ColorDepth ref={ref} />
        </EffectComposer>
      )
    )
    await flush()

    expect(ref.current!.bitDepth).toBe(defaultBitDepth)

    await React.act(async () => root.render(null))
  })
})
