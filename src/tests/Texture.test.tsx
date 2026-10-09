import { TextureEffect } from 'postprocessing'
import * as React from 'react'
import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { Texture } from '../effects/Texture'
import { flush, root } from './test-utils'

describe('Texture', () => {
  it('uses a passed texture without loading anything', async () => {
    const loadSpy = vi.spyOn(THREE.TextureLoader.prototype, 'load')
    const ref = React.createRef<TextureEffect>()
    const texture = new THREE.Texture()

    await React.act(async () =>
      root.render(
        <EffectComposer>
          <Texture ref={ref} texture={texture} />
        </EffectComposer>
      )
    )
    await flush()

    expect(loadSpy).not.toHaveBeenCalled()
    expect(ref.current!.texture).toBe(texture)
    // A user-provided texture is not mutated
    expect(texture.colorSpace).toBe(THREE.NoColorSpace)

    await React.act(async () => root.render(null))
    loadSpy.mockRestore()
  })

  it('swaps a passed texture live, without reconstructing the effect', async () => {
    const ref = React.createRef<TextureEffect>()
    const a = new THREE.Texture()
    const b = new THREE.Texture()

    const render = (texture: THREE.Texture) =>
      root.render(
        <EffectComposer>
          <Texture ref={ref} texture={texture} />
        </EffectComposer>
      )

    await React.act(async () => render(a))
    await flush()
    const first = ref.current

    await React.act(async () => render(b))
    await flush()

    expect(ref.current).toBe(first)
    expect(ref.current!.texture).toBe(b)

    await React.act(async () => root.render(null))
  })
})
