import * as React from 'react'
import { Vector2 } from 'three'
import { describe, expect, it } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { Linocut, LinocutEffect } from '../effects/Linocut'
import { flush, root } from './test-utils'

describe('Linocut', () => {
  it('coerces a tuple center into the Vector2 uniform', async () => {
    const ref = React.createRef<LinocutEffect>()

    await React.act(async () =>
      root.render(
        <EffectComposer>
          <Linocut ref={ref} center={[0.25, 0.75]} />
        </EffectComposer>
      )
    )
    await flush()

    expect(ref.current!.center).toBeInstanceOf(Vector2)
    expect(ref.current!.center.toArray()).toEqual([0.25, 0.75])

    await React.act(async () => root.render(null))
  })

  it('applies props live, without reconstructing the effect', async () => {
    const ref = React.createRef<LinocutEffect>()

    const render = (scale: number, rotation: number) =>
      root.render(
        <EffectComposer>
          <Linocut ref={ref} scale={scale} rotation={rotation} noiseScale={scale} />
        </EffectComposer>
      )

    await React.act(async () => render(0.5, 0))
    await flush()
    const first = ref.current

    await React.act(async () => render(0.9, 1))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.uniforms.get('scale')!.value).toBeCloseTo(0.9)
    expect(ref.current!.uniforms.get('noiseScale')!.value).toBeCloseTo(0.9)
    expect(ref.current!.uniforms.get('rotation')!.value).toBe(1)

    await React.act(async () => root.render(null))
  })

  it('resets center to its default when the prop is removed', async () => {
    const ref = React.createRef<LinocutEffect>()

    await React.act(async () =>
      root.render(
        <EffectComposer>
          <Linocut ref={ref} center={[0.1, 0.2]} />
        </EffectComposer>
      )
    )
    await flush()

    await React.act(async () =>
      root.render(
        <EffectComposer>
          <Linocut ref={ref} />
        </EffectComposer>
      )
    )
    await flush()

    expect(ref.current!.center.toArray()).toEqual([0.5, 0.5])

    await React.act(async () => root.render(null))
  })
})
