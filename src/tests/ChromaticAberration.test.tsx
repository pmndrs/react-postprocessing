import { ChromaticAberrationEffect, EffectComposer as EffectComposerImpl } from 'postprocessing'
import * as React from 'react'
import { Vector2 } from 'three'
import { describe, expect, it } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { ChromaticAberration } from '../effects/ChromaticAberration'
import { flush, root } from './test-utils'

describe('ChromaticAberration', () => {
  it('coerces a tuple offset into a real Vector2 (#348)', async () => {
    const ref = React.createRef<ChromaticAberrationEffect>()
    const composerRef = React.createRef<EffectComposerImpl>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <ChromaticAberration ref={ref} offset={[0.001, 0.0005]} />
        </EffectComposer>
      )
    )

    await flush()

    expect(ref.current!.offset).toBeInstanceOf(Vector2)
    expect(() => ref.current!.offset.set(0.002, 0.001)).not.toThrow()
    expect(ref.current!.offset.x).toBeCloseTo(0.002)
    expect(ref.current!.offset.y).toBeCloseTo(0.001)

    await React.act(async () => root.render(null))
  })
})
