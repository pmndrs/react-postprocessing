import { EffectComposer as EffectComposerImpl, GodRaysEffect } from 'postprocessing'
import * as React from 'react'
import { Mesh, SphereGeometry } from 'three'
import { describe, expect, it, vi } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { GodRays } from '../effects/GodRays'
import { flush, root, waitForComposer } from './test-utils'

describe('GodRays', () => {
  it('applies density live, without reconstructing the effect', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<GodRaysEffect>()
    const sun = new Mesh(new SphereGeometry(1, 8, 8))

    const render = (density: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <primitive object={sun} />
          <GodRays ref={ref} sun={sun} density={density} />
        </EffectComposer>
      )

    await React.act(async () => render(0.9))
    await waitForComposer(composerRef)
    await flush()
    const first = ref.current
    expect(first!.godRaysMaterial.density).toBeCloseTo(0.9)

    await React.act(async () => render(0.5))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.godRaysMaterial.density).toBeCloseTo(0.5)

    await React.act(async () => root.render(null))
  })

  it('still reconstructs when resolutionScale (construction-only) changes', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<GodRaysEffect>()
    const sun = new Mesh(new SphereGeometry(1, 8, 8))

    const render = (resolutionScale: number) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <primitive object={sun} />
          <GodRays ref={ref} sun={sun} resolutionScale={resolutionScale} />
        </EffectComposer>
      )

    await React.act(async () => render(0.5))
    await waitForComposer(composerRef)
    await flush()
    const first = ref.current

    await React.act(async () => render(1))
    await flush()

    expect(ref.current).not.toBe(first)

    await React.act(async () => root.render(null))
  })

  it('invalidates when sun is swapped for a different mesh, so frameloop="demand" repaints', async () => {
    const composerRef = React.createRef<EffectComposerImpl>()
    const ref = React.createRef<GodRaysEffect>()
    const sunA = new Mesh(new SphereGeometry(1, 8, 8))
    const sunB = new Mesh(new SphereGeometry(1, 8, 8))

    // Both meshes stay mounted, so only GodRays' own lightSource update can call invalidate()
    const render = (sun: Mesh) =>
      root.render(
        <EffectComposer ref={composerRef}>
          <primitive object={sunA} />
          <primitive object={sunB} />
          <GodRays ref={ref} sun={sun} />
        </EffectComposer>
      )

    await React.act(async () => render(sunA))
    await waitForComposer(composerRef)
    await flush()
    expect(ref.current!.lightSource).toBe(sunA)

    const invalidateSpy = vi.spyOn(root.render(null).getState(), 'invalidate')

    await React.act(async () => render(sunB))
    await flush()

    expect(ref.current!.lightSource).toBe(sunB)
    expect(invalidateSpy).toHaveBeenCalled()

    invalidateSpy.mockRestore()
    await React.act(async () => root.render(null))
  })
})
