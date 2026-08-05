import { EffectComposer as EffectComposerImpl, GlitchEffect, GlitchMode } from 'postprocessing'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { Glitch } from '../effects/Glitch'
import { flush, root } from './test-utils'

describe('Glitch', () => {
  it('toggles active/mode live, without reconstructing the effect', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<GlitchEffect>()

    const render = (active: boolean) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <Glitch ref={ref} active={active} />
        </EffectComposer>
      )

    await React.act(async () => render(true))
    await flush()
    const first = ref.current
    expect(first!.mode).toBe(GlitchMode.SPORADIC)

    await React.act(async () => render(false))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.mode).toBe(GlitchMode.DISABLED)

    await React.act(async () => root.render(null))
  })

  it('reconstructs when dtSize (construction-only) changes', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<GlitchEffect>()

    const render = (dtSize: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <Glitch ref={ref} dtSize={dtSize} />
        </EffectComposer>
      )

    await React.act(async () => render(64))
    await flush()
    const first = ref.current

    await React.act(async () => render(128))
    await flush()

    expect(ref.current).not.toBe(first)

    await React.act(async () => root.render(null))
  })
})
