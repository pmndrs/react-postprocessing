import { EffectComposer as EffectComposerImpl } from 'postprocessing'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { N8AO } from '../effects/N8AO'
import { flush, root } from './test-utils'

describe('N8AO', () => {
  it('invalidates after a live config change and after a quality change, so frameloop="demand" repaints', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const invalidateSpy = vi.spyOn(root.render(null).getState(), 'invalidate')

    const render = (intensity: number, quality?: 'performance' | 'ultra') =>
      root.render(
        <EffectComposer ref={composerRef}>
          <N8AO intensity={intensity} quality={quality} />
        </EffectComposer>
      )

    await React.act(async () => render(1))
    await flush()
    invalidateSpy.mockClear()

    await React.act(async () => render(2))
    await flush()
    expect(invalidateSpy).toHaveBeenCalled()

    invalidateSpy.mockClear()

    await React.act(async () => render(2, 'ultra'))
    await flush()
    expect(invalidateSpy).toHaveBeenCalled()

    invalidateSpy.mockRestore()
    await React.act(async () => root.render(null))
  })
})
