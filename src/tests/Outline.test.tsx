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
})
