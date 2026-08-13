import { DepthPickingPass, EffectComposer as EffectComposerImpl, EffectPass, RenderPass } from 'postprocessing'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { Autofocus } from '../effects/Autofocus'
import { flush, root, strict, waitForComposer } from './test-utils'

describe('Autofocus', () => {
  it('inserts depthPickingPass right after RenderPass, not appended at the end', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()

    await React.act(async () => root.render(<EffectComposer ref={composerRef}>{<Autofocus />}</EffectComposer>))
    const composer = await waitForComposer(composerRef)
    await flush()

    expect(composer.passes[0]).toBeInstanceOf(RenderPass)
    expect(composer.passes[1]).toBeInstanceOf(DepthPickingPass)

    await React.act(async () => root.render(null))
  })

  it('never lets depthPickingPass own renderToScreen, regardless of StrictMode double-invocation', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()

    await React.act(async () => root.render(strict(<EffectComposer ref={composerRef}>{<Autofocus />}</EffectComposer>)))
    const composer = await waitForComposer(composerRef)
    for (let i = 0; i < 10; i++) await flush()

    const depthPickingPass = composer.passes.find((p) => p instanceof DepthPickingPass)!
    expect(depthPickingPass.renderToScreen).toBe(false)

    // The real, visible output (DepthOfField's own EffectPass) must own it instead.
    const effectPass = composer.passes.find((p) => p instanceof EffectPass)!
    expect(effectPass.renderToScreen).toBe(true)

    await React.act(async () => root.render(null))
  })
})
