import { LensDistortionEffect } from 'postprocessing'
import * as React from 'react'
import { Vector2 } from 'three'
import { describe, expect, it } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { LensDistortion } from '../effects/LensDistortion'
import { flush, root } from './test-utils'

describe('LensDistortion', () => {
  it('coerces tuple props into the effect Vector2 uniforms', async () => {
    const ref = React.createRef<LensDistortionEffect>()

    await React.act(async () =>
      root.render(
        <EffectComposer>
          <LensDistortion ref={ref} distortion={[0.5, 0.25]} focalLength={[0.7, 0.8]} skew={0.1} />
        </EffectComposer>
      )
    )
    await flush()

    expect(ref.current!.distortion).toBeInstanceOf(Vector2)
    expect(ref.current!.distortion.toArray()).toEqual([0.5, 0.25])
    expect(ref.current!.focalLength.toArray()).toEqual([0.7, 0.8])
    expect(ref.current!.skew).toBeCloseTo(0.1)

    await React.act(async () => root.render(null))
  })

  it('applies distortion live, without reconstructing the effect', async () => {
    const ref = React.createRef<LensDistortionEffect>()

    const render = (x: number) =>
      root.render(
        <EffectComposer>
          <LensDistortion ref={ref} distortion={[x, x]} />
        </EffectComposer>
      )

    await React.act(async () => render(0.1))
    await flush()
    const first = ref.current

    await React.act(async () => render(0.6))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.distortion.x).toBeCloseTo(0.6)

    await React.act(async () => root.render(null))
  })

  it('resets distortion to its default when the prop is removed', async () => {
    const ref = React.createRef<LensDistortionEffect>()

    await React.act(async () =>
      root.render(
        <EffectComposer>
          <LensDistortion ref={ref} distortion={[0.5, 0.5]} />
        </EffectComposer>
      )
    )
    await flush()

    await React.act(async () =>
      root.render(
        <EffectComposer>
          <LensDistortion ref={ref} />
        </EffectComposer>
      )
    )
    await flush()

    expect(ref.current!.distortion.toArray()).toEqual([0, 0])

    await React.act(async () => root.render(null))
  })
})
