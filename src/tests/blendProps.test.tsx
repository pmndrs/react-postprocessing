import { BlendFunction, EffectComposer as EffectComposerImpl, SelectiveBloomEffect, type Effect } from 'postprocessing'
import * as React from 'react'
import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { DepthOfField } from '../effects/DepthOfField'
import { GodRays } from '../effects/GodRays'
import { LUT } from '../effects/LUT'
import { Outline } from '../effects/Outline'
import { Pixelation } from '../effects/Pixelation'
import { SelectiveBloom } from '../effects/SelectiveBloom'
import { ShockWave } from '../effects/ShockWave'
import { SSAO } from '../effects/SSAO'
import { flush, root } from './test-utils'

const sun = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8))
const light = new THREE.PointLight()
const lut = new THREE.Data3DTexture(new Uint8Array(2 * 2 * 2 * 4), 2, 2, 2)

type BlendProps = { blendFunction?: BlendFunction; opacity?: number }

const CASES: {
  label: string
  composerProps?: Record<string, unknown>
  render: (ref: React.Ref<any>, props: BlendProps) => React.ReactElement
}[] = [
  { label: 'DepthOfField', render: (ref, p) => <DepthOfField ref={ref} {...p} /> },
  { label: 'GodRays', render: (ref, p) => <GodRays ref={ref} sun={sun} {...p} /> },
  { label: 'LUT', render: (ref, p) => <LUT ref={ref} lut={lut} {...p} /> },
  { label: 'Outline', render: (ref, p) => <Outline ref={ref} {...p} /> },
  { label: 'Pixelation', render: (ref, p) => <Pixelation ref={ref} {...p} /> },
  { label: 'SelectiveBloom', render: (ref, p) => <SelectiveBloom ref={ref} lights={[light]} {...p} /> },
  { label: 'ShockWave', render: (ref, p) => <ShockWave ref={ref} {...p} /> },
  { label: 'SSAO', composerProps: { enableNormalPass: true }, render: (ref, p) => <SSAO ref={ref} {...p} /> },
]

describe('blendFunction/opacity on hand-built effects', () => {
  it.each(CASES)('$label applies them live and resets them on removal', async ({ composerProps, render }) => {
    const ref = React.createRef<Effect>()
    const mount = (props: BlendProps) =>
      root.render(
        <EffectComposer {...composerProps}>
          <primitive object={sun} />
          {render(ref, props)}
        </EffectComposer>
      )

    await React.act(async () => mount({}))
    await flush()
    const effect = ref.current!
    const defaultBlend = effect.blendMode.blendFunction

    await React.act(async () => mount({ blendFunction: BlendFunction.DARKEN, opacity: 0.25 }))
    await flush()
    expect(ref.current).toBe(effect)
    expect(effect.blendMode.blendFunction).toBe(BlendFunction.DARKEN)
    expect(effect.blendMode.opacity.value).toBe(0.25)

    await React.act(async () => mount({}))
    await flush()
    expect(effect.blendMode.blendFunction).toBe(defaultBlend)
    expect(effect.blendMode.opacity.value).toBe(1)

    await React.act(async () => root.render(null))
  })

  it('SelectiveBloom defaults to ADD and still accepts another blendFunction', async () => {
    const ref = React.createRef<SelectiveBloomEffect>()
    const composerRef = React.createRef<EffectComposerImpl>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <SelectiveBloom ref={ref} lights={[light]} />
        </EffectComposer>
      )
    )
    await flush()
    expect(ref.current!.blendMode.blendFunction).toBe(BlendFunction.ADD)

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef}>
          <SelectiveBloom ref={ref} lights={[light]} blendFunction={BlendFunction.SCREEN} />
        </EffectComposer>
      )
    )
    await flush()
    expect(ref.current!.blendMode.blendFunction).toBe(BlendFunction.SCREEN)

    await React.act(async () => root.render(null))
  })
})
