import { useThree } from '@react-three/fiber'
import { DepthPickingPass as DepthPickingPassImpl, EffectComposer as EffectComposerImpl, EffectPass, RenderPass } from 'postprocessing'
import * as React from 'react'
import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { Noise } from '../effects/Noise'
import { DepthPicking, useDepthPicking, type DepthPickingApi } from '../passes/DepthPicking'
import { flush, root, strict, waitForComposer } from './test-utils'

describe('DepthPicking', () => {
  it('adds its pass after RenderPass', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()

    await React.act(async () => root.render(<EffectComposer ref={composerRef}>{<DepthPicking />}</EffectComposer>))
    const composer = await waitForComposer(composerRef)
    await flush()

    expect(composer.passes[0]).toBeInstanceOf(RenderPass)
    expect(composer.passes.slice(1)).toContainEqual(expect.any(DepthPickingPassImpl))

    await React.act(async () => root.render(null))
  })

  // enableNormalPass adds a NormalPass after RenderPass, shifting pass indices
  it('still keeps its trailing CopyPass owning renderToScreen with enableNormalPass and other effects around it', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef} enableNormalPass>
          <Noise />
          <DepthPicking />
          <Noise />
        </EffectComposer>
      )
    )
    const composer = await waitForComposer(composerRef)
    await flush()

    const depthPickingPass = composer.passes.find((p) => p instanceof DepthPickingPassImpl)!
    expect(depthPickingPass.renderToScreen).toBe(false)
    expect(composer.passes.at(-1)!.renderToScreen).toBe(true)

    await React.act(async () => root.render(null))
  })

  it('never lets its pass own renderToScreen when a real effect follows it, regardless of StrictMode', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()

    await React.act(async () =>
      root.render(
        strict(
          <EffectComposer ref={composerRef}>
            <DepthPicking />
            <Noise />
          </EffectComposer>
        )
      )
    )
    const composer = await waitForComposer(composerRef)
    for (let i = 0; i < 10; i++) await flush()

    const pass = composer.passes.find((p) => p instanceof DepthPickingPassImpl)!
    expect(pass.renderToScreen).toBe(false)

    // The real, visible output (Noise's own EffectPass) must own it instead.
    const effectPass = composer.passes.find((p) => p instanceof EffectPass)!
    expect(effectPass.renderToScreen).toBe(true)

    await React.act(async () => root.render(null))
  })

  // DepthPickingPass renders nothing without a pending readDepth(), so it must never
  // own renderToScreen - its always-running CopyPass does instead
  it('never owns renderToScreen even with no other effects - its own trailing CopyPass does instead', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()

    await React.act(async () => root.render(<EffectComposer ref={composerRef}>{<DepthPicking />}</EffectComposer>))
    const composer = await waitForComposer(composerRef)
    await flush()

    expect(composer.passes).toHaveLength(3)
    const depthPickingPass = composer.passes.find((p) => p instanceof DepthPickingPassImpl)!
    expect(depthPickingPass.renderToScreen).toBe(false)
    expect(composer.passes.at(-1)!.renderToScreen).toBe(true)
    expect(composer.passes.at(-1)).not.toBeInstanceOf(DepthPickingPassImpl)

    await React.act(async () => root.render(null))
  })

  it('exposes readDepth via ref and renders nothing itself', async () => {
    const ref = React.createRef<DepthPickingApi>()

    await React.act(async () =>
      root.render(
        <EffectComposer>
          <DepthPicking ref={ref} />
        </EffectComposer>
      )
    )
    await flush()

    expect(ref.current).toBeTruthy()
    expect(typeof ref.current!.readDepth).toBe('function')
  })
})

describe('useDepthPicking', () => {
  function Picker({
    passRef,
    camera,
    onReady,
  }: {
    passRef: React.RefObject<DepthPickingApi | null>
    camera?: THREE.Camera
    onReady: (getHit: ReturnType<typeof useDepthPicking>) => void
  }) {
    const getHit = useDepthPicking(passRef, camera)
    onReady(getHit)
    return null
  }

  it('unprojects a picked depth into a world-space point using an explicitly passed camera', async () => {
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
    camera.position.set(0, 0, 5)
    camera.updateMatrixWorld()
    camera.updateProjectionMatrix()

    // A stand-in for the mounted pass - readDepth resolves to a fixed,
    // known depth so the resulting world position is fully predictable.
    const fakePass: DepthPickingApi = { readDepth: async () => 0.5 }
    const passRef = { current: fakePass }

    let getHit: ReturnType<typeof useDepthPicking> = null!

    await React.act(async () =>
      root.render(
        <EffectComposer camera={camera}>
          <Picker passRef={passRef} camera={camera} onReady={(fn) => (getHit = fn)} />
        </EffectComposer>
      )
    )
    await flush()

    const hit = await getHit(0, 0)
    expect(hit).not.toBe(false)

    const expected = new THREE.Vector3(0, 0, 0.5 * 2 - 1).unproject(camera)
    expect((hit as THREE.Vector3).toArray()).toEqual(expected.toArray())
  })

  it("falls back to r3f's own default camera when none is passed explicitly", async () => {
    const fakePass: DepthPickingApi = { readDepth: async () => 0.5 }
    const passRef = { current: fakePass }

    let getHit: ReturnType<typeof useDepthPicking> = null!
    let defaultCamera: THREE.Camera | null = null

    function CaptureDefaultCamera() {
      defaultCamera = useThree((state) => state.camera)
      return null
    }

    await React.act(async () =>
      root.render(
        <EffectComposer>
          <CaptureDefaultCamera />
          <Picker passRef={passRef} onReady={(fn) => (getHit = fn)} />
        </EffectComposer>
      )
    )
    await flush()

    const hit = await getHit(0, 0)
    expect(hit).not.toBe(false)

    const expected = new THREE.Vector3(0, 0, 0.5 * 2 - 1).unproject(defaultCamera!)
    expect((hit as THREE.Vector3).toArray()).toEqual(expected.toArray())
  })

  // The hook takes a plain ref, not EffectComposerContext, so it works anywhere under <Canvas>
  it('works when called outside the <EffectComposer> the pass is mounted in', async () => {
    const fakePass: DepthPickingApi = { readDepth: async () => 0.5 }
    const passRef = { current: fakePass }
    let getHit: ReturnType<typeof useDepthPicking> = null!

    await React.act(async () =>
      root.render(
        <>
          <EffectComposer>
            <DepthPicking />
          </EffectComposer>
          <Picker passRef={passRef} onReady={(fn) => (getHit = fn)} />
        </>
      )
    )
    await flush()

    expect(await getHit(0, 0)).not.toBe(false)
  })

  it('returns false when depth is at the far plane (nothing hit)', async () => {
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
    const fakePass: DepthPickingApi = { readDepth: async () => 1 }
    const passRef = { current: fakePass }

    let getHit: ReturnType<typeof useDepthPicking> = null!

    await React.act(async () =>
      root.render(
        <EffectComposer camera={camera}>
          <Picker passRef={passRef} camera={camera} onReady={(fn) => (getHit = fn)} />
        </EffectComposer>
      )
    )
    await flush()

    expect(await getHit(0, 0)).toBe(false)
  })

  it('returns false when the pass ref is not attached yet', async () => {
    const passRef = { current: null }
    let getHit: ReturnType<typeof useDepthPicking> = null!

    await React.act(async () =>
      root.render(
        <EffectComposer>
          <Picker passRef={passRef} onReady={(fn) => (getHit = fn)} />
        </EffectComposer>
      )
    )
    await flush()

    expect(await getHit(0, 0)).toBe(false)
  })
})
