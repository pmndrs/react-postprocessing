import { EffectComposer as EffectComposerImpl, GridEffect } from 'postprocessing'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { Grid } from '../effects/Grid'
import { flush, root } from './test-utils'

describe('Grid', () => {
  it('applies scale/lineWidth live, without reconstructing the effect', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<GridEffect>()

    const render = (scale: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <Grid ref={ref} scale={scale} lineWidth={0.1} />
        </EffectComposer>
      )

    await React.act(async () => render(1))
    await flush()
    const first = ref.current
    expect(first!.scale).toBe(1)
    expect(first!.lineWidth).toBeCloseTo(0.1)

    await React.act(async () => render(2))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.scale).toBe(2)

    await React.act(async () => root.render(null))
  })
})
