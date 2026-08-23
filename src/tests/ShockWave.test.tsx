import { EffectComposer as EffectComposerImpl, ShockWaveEffect } from 'postprocessing'
import * as React from 'react'
import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { ShockWave } from '../effects/ShockWave'
import { flush, root } from './test-utils'

describe('ShockWave', () => {
  it('applies speed and position, which createEffectComponent cannot (ShockWaveEffect takes them as a 3rd ctor arg)', async () => {
    const ref = React.createRef<ShockWaveEffect>()
    const composerRef = React.createRef<EffectComposerImpl>()
    const position = new Vector3(1, 2, 3)

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <ShockWave ref={ref} speed={5} position={position} />
        </EffectComposer>
      )
    )

    await flush()

    expect(ref.current!.speed).toBe(5)
    expect(ref.current!.position).toBe(position)

    await React.act(async () => root.render(null))
  })

  it('updates speed/position live, without reconstructing the instance', async () => {
    const ref = React.createRef<ShockWaveEffect>()
    const composerRef = React.createRef<EffectComposerImpl>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <ShockWave ref={ref} speed={1} />
        </EffectComposer>
      )
    )

    await flush()

    const firstInstance = ref.current

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <ShockWave ref={ref} speed={2} waveSize={0.5} />
        </EffectComposer>
      )
    )

    await flush()

    expect(ref.current).toBe(firstInstance)
    expect(ref.current!.speed).toBe(2)
    expect(ref.current!.waveSize).toBe(0.5)

    await React.act(async () => root.render(null))
  })

  it('resets speed to its constructor default when the prop is removed', async () => {
    const ref = React.createRef<ShockWaveEffect>()
    const composerRef = React.createRef<EffectComposerImpl>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <ShockWave ref={ref} speed={5} />
        </EffectComposer>
      )
    )

    await flush()

    expect(ref.current!.speed).toBe(5)
    const defaultSpeed = 2

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <ShockWave ref={ref} />
        </EffectComposer>
      )
    )

    await flush()

    expect(ref.current!.speed).toBe(defaultSpeed)

    await React.act(async () => root.render(null))
  })
})
