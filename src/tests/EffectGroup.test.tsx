import { CopyPass, Effect, EffectComposer as EffectComposerImpl, EffectPass, RenderPass } from 'postprocessing'
import * as React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { EffectGroup } from '../EffectGroup'
import { wrapEffect } from '../wrapEffect'
import { EFFECT_SHADER, flush, root, strict, waitForComposer } from './test-utils'

class EffectA extends Effect {
  constructor() {
    super('EffectA', EFFECT_SHADER)
  }
}

class EffectB extends Effect {
  constructor() {
    super('EffectB', EFFECT_SHADER)
  }
}

class EffectC extends Effect {
  constructor() {
    super('EffectC', EFFECT_SHADER)
  }
}

const WrappedEffectA = wrapEffect(EffectA)
const WrappedEffectB = wrapEffect(EffectB)
const WrappedEffectC = wrapEffect(EffectC)

// EffectGroup's pass appears in composer.passes only after its own
// collection-walk effect (child) and EffectComposer's own tree-walk +
// rebuild effects (parent) have all settled - can take more than one flush.
const waitUntil = async (predicate: () => boolean): Promise<void> => {
  for (let i = 0; i < 50; i++) {
    await flush()
    if (predicate()) return
  }
  throw new Error('Condition never became true')
}

const waitForGroupPass = async (composer: EffectComposerImpl): Promise<EffectPass> => {
  await waitUntil(() => composer.passes.some((p) => p instanceof EffectPass))
  return composer.passes.find((p): p is EffectPass => p instanceof EffectPass)!
}

afterEach(async () => {
  await React.act(async () => {
    root.render(null)
  })
})

describe('EffectGroup', () => {
  it('groups its children into exactly one EffectPass, in JSX order', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <WrappedEffectA />
          <EffectGroup>
            <WrappedEffectB />
            <WrappedEffectC />
          </EffectGroup>
        </EffectComposer>
      )
    )
    const composer = await waitForComposer(composerRef)
    await waitUntil(() => composer.passes.filter((p) => p instanceof EffectPass).length === 2)

    const effectPasses = composer.passes.filter((p): p is EffectPass => p instanceof EffectPass)
    expect(effectPasses).toHaveLength(2)

    const groupPass = effectPasses.find((p) => (p as unknown as { effects: Effect[] }).effects.length === 2)!
    expect(groupPass).toBeDefined()
    const groupedEffects = (groupPass as unknown as { effects: Effect[] }).effects
    expect(groupedEffects[0]).toBeInstanceOf(EffectB)
    expect(groupedEffects[1]).toBeInstanceOf(EffectC)
  })

  it('keeps sibling effects out of the group and preserves relative pass order', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <WrappedEffectA />
          <EffectGroup>
            <WrappedEffectB />
          </EffectGroup>
          <WrappedEffectC />
        </EffectComposer>
      )
    )
    const composer = await waitForComposer(composerRef)
    await waitUntil(() => composer.passes.filter((p) => p instanceof EffectPass).length === 3)

    // A and C are not adjacent (the group's pass sits between them), so
    // they must NOT get merged into one EffectPass with each other.
    expect(composer.passes[0]).toBeInstanceOf(RenderPass)

    const effectPasses = composer.passes.filter((p): p is EffectPass => p instanceof EffectPass)
    expect(effectPasses).toHaveLength(3)

    const effectsOf = (p: EffectPass) => (p as unknown as { effects: Effect[] }).effects
    expect(effectsOf(effectPasses[0])).toEqual([expect.any(EffectA)])
    expect(effectsOf(effectPasses[1])).toEqual([expect.any(EffectB)])
    expect(effectsOf(effectPasses[2])).toEqual([expect.any(EffectC)])
  })

  it('toggles enabled without reconstructing the pass', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const groupRef = React.createRef<EffectPass>()

    const render = (enabled: boolean) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <EffectGroup ref={groupRef} enabled={enabled}>
            <WrappedEffectA />
          </EffectGroup>
        </EffectComposer>
      )

    await React.act(async () => render(true))
    await waitForComposer(composerRef)
    await waitUntil(() => groupRef.current !== null)

    const pass = groupRef.current
    expect(pass).not.toBeNull()
    expect(pass!.enabled).toBe(true)

    await React.act(async () => render(false))
    await flush()

    expect(groupRef.current).toBe(pass)
    expect(pass!.enabled).toBe(false)
  })

  it('keeps something rendering to the screen when the only effect is disabled, via a trailing CopyPass', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const groupRef = React.createRef<EffectPass>()

    const render = (enabled: boolean) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <EffectGroup ref={groupRef} enabled={enabled}>
            <WrappedEffectA />
          </EffectGroup>
        </EffectComposer>
      )

    await React.act(async () => render(true))
    const composer = await waitForComposer(composerRef)
    await waitUntil(() => groupRef.current !== null)

    // Exactly one currently-enabled pass must own renderToScreen at all
    // times - otherwise nothing (enabled) ever reaches the canvas.
    const enabledRenderToScreenCount = () => composer.passes.filter((p) => p.enabled && p.renderToScreen).length

    // Enabled: the group's own EffectPass runs; the trailing CopyPass
    // (always enabled, always structurally last) owns renderToScreen.
    expect(groupRef.current!.enabled).toBe(true)
    expect(groupRef.current!.renderToScreen).toBe(false)
    expect(enabledRenderToScreenCount()).toBe(1)

    await React.act(async () => render(false))
    await flush()

    // Disabled: the render loop skips the EffectPass entirely, but the
    // CopyPass - unaffected, still enabled, still owning renderToScreen -
    // blits whatever buffer is already there through to the screen.
    expect(groupRef.current!.enabled).toBe(false)
    expect(enabledRenderToScreenCount()).toBe(1)
  })

  it('shares a single trailing CopyPass across multiple EffectGroups, not one per group', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <EffectGroup>
            <WrappedEffectA />
          </EffectGroup>
          <EffectGroup>
            <WrappedEffectB />
          </EffectGroup>
        </EffectComposer>
      )
    )
    const composer = await waitForComposer(composerRef)
    await waitUntil(() => composer.passes.filter((p) => p instanceof EffectPass).length === 2)

    const copyPasses = composer.passes.filter((p) => p instanceof CopyPass)
    expect(copyPasses).toHaveLength(1)
    // Structurally last, so it - not either group's own pass - owns renderToScreen.
    expect(composer.passes[composer.passes.length - 1]).toBe(copyPasses[0])
    expect(copyPasses[0].renderToScreen).toBe(true)
  })

  it('adds no CopyPass at all when no EffectGroup is present', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <WrappedEffectA />
        </EffectComposer>
      )
    )
    const composer = await waitForComposer(composerRef)
    await waitUntil(() => composer.passes.filter((p) => p instanceof EffectPass).length === 1)

    expect(composer.passes.some((p) => p instanceof CopyPass)).toBe(false)
  })

  it('exposes the underlying EffectPass via ref', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const groupRef = React.createRef<EffectPass>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <EffectGroup ref={groupRef}>
            <WrappedEffectA />
          </EffectGroup>
        </EffectComposer>
      )
    )
    const composer = await waitForComposer(composerRef)
    await waitForGroupPass(composer)

    expect(groupRef.current).toBeInstanceOf(EffectPass)
    expect(composer.passes).toContain(groupRef.current)
  })

  it('disposes its pass on unmount without double-disposing the grouped effects', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const effectDisposeSpy = vi.spyOn(EffectB.prototype, 'dispose')

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <EffectGroup>
            <WrappedEffectB />
          </EffectGroup>
        </EffectComposer>
      )
    )
    const composer = await waitForComposer(composerRef)
    const groupPass = await waitForGroupPass(composer)
    expect(groupPass).toBeDefined()

    await React.act(async () => root.render(null))

    expect(effectDisposeSpy).toHaveBeenCalledTimes(1)

    effectDisposeSpy.mockRestore()
  })

  it('rebuilds the pass (new identity) when the effect list inside the group changes, mirroring buildPasses', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const groupRef = React.createRef<EffectPass>()

    const render = (withSecond: boolean) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <EffectGroup ref={groupRef}>
            <WrappedEffectA />
            {withSecond && <WrappedEffectB />}
          </EffectGroup>
        </EffectComposer>
      )

    await React.act(async () => render(false))
    await waitForComposer(composerRef)
    await waitUntil(() => groupRef.current !== null)

    const firstPass = groupRef.current
    expect((firstPass as unknown as { effects: Effect[] }).effects).toHaveLength(1)

    await React.act(async () => render(true))
    await waitUntil(() => groupRef.current !== firstPass)

    expect(groupRef.current).not.toBe(firstPass)
    expect((groupRef.current as unknown as { effects: Effect[] }).effects).toHaveLength(2)
  })

  it('initializes every effect in a rebuilt group, including ones added at runtime', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const groupRef = React.createRef<EffectPass>()
    const initializeSpy = vi.spyOn(EffectB.prototype, 'initialize')

    const render = (withSecond: boolean) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <EffectGroup ref={groupRef}>
            <WrappedEffectA />
            {withSecond && <WrappedEffectB />}
          </EffectGroup>
        </EffectComposer>
      )

    await React.act(async () => render(false))
    await waitForComposer(composerRef)
    await waitUntil(() => groupRef.current !== null)

    expect(initializeSpy).not.toHaveBeenCalled()

    await React.act(async () => render(true))
    await waitUntil(() => (groupRef.current as unknown as { effects: Effect[] }).effects.length === 2)

    expect(initializeSpy).toHaveBeenCalledTimes(1)

    initializeSpy.mockRestore()
  })

  it('ends up with exactly one EffectPass in StrictMode, not a stray extra from double-invoked state updates', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()

    await React.act(async () =>
      root.render(
        strict(
          <EffectComposer ref={composerRef}>
            <EffectGroup>
              <WrappedEffectA />
            </EffectGroup>
          </EffectComposer>
        )
      )
    )
    const composer = await waitForComposer(composerRef)
    await waitUntil(() => composer.passes.some((p) => p instanceof EffectPass))

    expect(composer.passes.filter((p) => p instanceof EffectPass)).toHaveLength(1)
  })
})
