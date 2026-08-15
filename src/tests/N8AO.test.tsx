import { CopyPass, EffectComposer as EffectComposerImpl } from 'postprocessing'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { N8AO } from '../passes/N8AO'
import { flush, root, waitForComposer } from './test-utils'

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

  it('toggles enabled without reconstructing the pass', async () => {
    const ref = React.createRef<any>()

    const render = (enabled: boolean) =>
      root.render(
        <EffectComposer>
          <N8AO ref={ref} enabled={enabled} />
        </EffectComposer>
      )

    await React.act(async () => render(true))
    await flush()
    const instance = ref.current
    expect(instance.enabled).toBe(true)

    await React.act(async () => render(false))
    await flush()
    expect(ref.current).toBe(instance)
    expect(instance.enabled).toBe(false)

    await React.act(async () => root.render(null))
  })

  it('gets the shared trailing CopyPass safety net, keeping something rendering to screen when disabled', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<any>()

    const render = (enabled: boolean) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <N8AO ref={ref} enabled={enabled} />
        </EffectComposer>
      )

    await React.act(async () => render(true))
    const composer = await waitForComposer(composerRef)
    await flush()

    const copyPass = composer.passes.find((p) => p instanceof CopyPass)
    expect(copyPass).toBeDefined()

    const enabledRenderToScreenCount = () => composer.passes.filter((p) => p.enabled && p.renderToScreen).length
    expect(enabledRenderToScreenCount()).toBe(1)

    await React.act(async () => render(false))
    await flush()

    // N8AO's own pass is now disabled, but exactly one enabled pass must
    // still own renderToScreen - otherwise nothing reaches the canvas.
    expect(enabledRenderToScreenCount()).toBe(1)
    expect(copyPass!.renderToScreen).toBe(true)

    await React.act(async () => root.render(null))
  })
})
