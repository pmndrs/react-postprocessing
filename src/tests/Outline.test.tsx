import { EffectComposer as EffectComposerImpl, OutlineEffect, Selection as PPSelection } from 'postprocessing'
import * as React from 'react'
import { Mesh, Object3D } from 'three'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { Outline } from '../effects/Outline'
import { Select, Selection } from '../Selection'
import { flush, root, waitForComposer } from './test-utils'

afterEach(async () => {
  await React.act(async () => {
    root.render(null)
  })
})

describe('Outline', () => {
  it('does not re-set its (empty, declarative-mode) selection on unrelated re-renders', async () => {
    const setSpy = vi.spyOn(PPSelection.prototype, 'set')
    const composerRef = React.createRef<EffectComposerImpl>()

    const render = (tick: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <Outline />
          <group name={`tick-${tick}`} />
        </EffectComposer>
      )

    await React.act(async () => render(0))
    await waitForComposer(composerRef)
    await flush()
    setSpy.mockClear()

    for (let t = 1; t <= 5; t++) {
      await React.act(async () => render(t))
      await flush()
    }

    expect(setSpy).not.toHaveBeenCalled()
    setSpy.mockRestore()
  })

  it('sets its selection from the Selection/Select API and clears it when the object deselects', async () => {
    const effectRef = React.createRef<OutlineEffect>()
    const meshRef = React.createRef<Mesh>()

    const render = (enabled: boolean) =>
      root.render(
        <EffectComposer>
          <Selection>
            <Select enabled={enabled}>
              <mesh ref={meshRef}>
                <boxGeometry />
                <meshBasicMaterial />
              </mesh>
            </Select>
            <Outline ref={effectRef} />
          </Selection>
        </EffectComposer>
      )

    await React.act(async () => render(true))
    await flush()
    await flush()

    expect(Array.from(effectRef.current!.selection)).toContain(meshRef.current)

    await React.act(async () => render(false))
    await flush()
    await flush()

    expect(Array.from(effectRef.current!.selection)).not.toContain(meshRef.current)
  })

  it('does not throw when a selection ref has not attached yet', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const unattachedRef = React.createRef<Object3D>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <Outline selection={[unattachedRef]} />
        </EffectComposer>
      )
    )
    await waitForComposer(composerRef)
    await expect(flush()).resolves.not.toThrow()
  })

  it('applies visibleEdgeColor live, without reconstructing the effect (#143)', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const effectRef = React.createRef<OutlineEffect>()

    const render = (color: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <Outline ref={effectRef} visibleEdgeColor={color} />
        </EffectComposer>
      )

    await React.act(async () => render(0xff0000))
    await waitForComposer(composerRef)
    await flush()

    const first = effectRef.current
    expect(first!.visibleEdgeColor.getHex()).toBe(0xff0000)

    await React.act(async () => render(0x00ff00))
    await flush()

    expect(effectRef.current).toBe(first)
    expect(effectRef.current!.visibleEdgeColor.getHex()).toBe(0x00ff00)
  })

  it('accepts a CSS color string for visibleEdgeColor/hiddenEdgeColor, not just a numeric hex (#187, #182)', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const effectRef = React.createRef<OutlineEffect>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <Outline ref={effectRef} visibleEdgeColor="red" hiddenEdgeColor="blue" />
        </EffectComposer>
      )
    )
    await waitForComposer(composerRef)
    await flush()

    expect(effectRef.current!.visibleEdgeColor.getHex()).toBe(0xff0000)
    expect(effectRef.current!.hiddenEdgeColor.getHex()).toBe(0x0000ff)
  })

  it('resets edgeStrength to its constructor default when the prop is removed', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const effectRef = React.createRef<OutlineEffect>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <Outline ref={effectRef} edgeStrength={100} />
        </EffectComposer>
      )
    )
    await waitForComposer(composerRef)
    await flush()

    expect(effectRef.current!.edgeStrength).toBe(100)

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <Outline ref={effectRef} />
        </EffectComposer>
      )
    )
    await flush()

    expect(effectRef.current!.edgeStrength).toBe(1)
  })

  it('still reconstructs when a construction-only prop (resolutionScale) changes', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const effectRef = React.createRef<OutlineEffect>()

    const render = (resolutionScale: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <Outline ref={effectRef} resolutionScale={resolutionScale} />
        </EffectComposer>
      )

    await React.act(async () => render(0.5))
    await waitForComposer(composerRef)
    await flush()
    const first = effectRef.current

    await React.act(async () => render(1))
    await flush()

    expect(effectRef.current).not.toBe(first)
  })

  it('does not dispose its render target on unrelated re-renders (multisampling has an unconditional dispose side effect)', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const effectRef = React.createRef<OutlineEffect>()

    const render = (tick: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <Outline ref={effectRef} />
          <group name={`tick-${tick}`} />
        </EffectComposer>
      )

    await React.act(async () => render(0))
    await waitForComposer(composerRef)
    await flush()

    // @ts-expect-error - `renderTargetMask` isn't part of the public OutlineEffect typing
    const disposeSpy = vi.spyOn(effectRef.current!.renderTargetMask, 'dispose')

    for (let t = 1; t <= 5; t++) {
      await React.act(async () => render(t))
      await flush()
    }

    expect(disposeSpy).not.toHaveBeenCalled()
    disposeSpy.mockRestore()
  })

})
