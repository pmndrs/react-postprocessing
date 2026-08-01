import { EffectComposer as EffectComposerImpl, SelectiveBloomEffect } from 'postprocessing'
import * as React from 'react'
import { Mesh, Object3D, PointLight } from 'three'
import { afterEach, describe, expect, it } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { SelectiveBloom } from '../effects/SelectiveBloom'
import { Select, Selection } from '../Selection'
import { flush, root, waitForComposer } from './test-utils'

afterEach(async () => {
  await React.act(async () => {
    root.render(null)
  })
})

describe('SelectiveBloom', () => {
  it('does not reconstruct the effect (with its GPU resources) on unrelated re-renders', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const effectRef = React.createRef<SelectiveBloomEffect>()
    const light = new PointLight()

    const render = (tick: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <SelectiveBloom ref={effectRef} lights={[light]} intensity={2} />
          <group name={`tick-${tick}`} />
        </EffectComposer>
      )

    await React.act(async () => render(0))
    await waitForComposer(composerRef)
    await flush()
    const first = effectRef.current
    expect(first).toBeTruthy()

    for (let t = 1; t <= 5; t++) {
      await React.act(async () => render(t))
      await flush()
    }

    expect(effectRef.current).toBe(first)
  })

  it('sets its selection from the Selection/Select API and clears it when the object deselects', async () => {
    const effectRef = React.createRef<SelectiveBloomEffect>()
    const meshRef = React.createRef<Mesh>()
    const light = new PointLight()

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
            <SelectiveBloom ref={effectRef} lights={[light]} />
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

  it('moves lights to the new render layer when selectionLayer changes', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const effectRef = React.createRef<SelectiveBloomEffect>()
    const light = new PointLight()
    const onLayer = (n: number) => light.layers.test({ mask: 1 << n } as never)

    const render = (layer: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <SelectiveBloom ref={effectRef} lights={[light]} selectionLayer={layer} />
        </EffectComposer>
      )

    await React.act(async () => render(10))
    await waitForComposer(composerRef)
    await flush()
    await flush()
    expect(onLayer(10)).toBe(true)

    await React.act(async () => render(15))
    await flush()
    await flush()

    expect(onLayer(15)).toBe(true)
    expect(onLayer(10)).toBe(false)
  })

  it('does not throw when a lights ref has not attached yet', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const unattachedRef = React.createRef<Object3D>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <SelectiveBloom lights={[unattachedRef]} />
        </EffectComposer>
      )
    )
    await waitForComposer(composerRef)
    await expect(flush()).resolves.not.toThrow()
  })
})
