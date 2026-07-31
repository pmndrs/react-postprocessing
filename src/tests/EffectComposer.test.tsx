import {
  BlendFunction,
  ColorAverageEffect,
  DepthDownsamplingPass,
  Effect,
  EffectComposer as EffectComposerImpl,
  EffectPass,
  NormalPass,
  RenderPass,
} from 'postprocessing'
import * as React from 'react'
import * as THREE from 'three'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { ColorAverage } from '../effects/ColorAverage'
import { wrapEffect } from '../wrapEffect'
import { EFFECT_SHADER, flush, root, strict, waitForComposer, waitForEffects, waitForNewComposer } from './test-utils'

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

afterEach(async () => {
  await React.act(async () => {
    root.render(null)
  })
})

describe('EffectComposer', () => {
  describe('registration and composition', () => {
    it('merges wrapped effects into a single EffectPass', async () => {
      const ref = React.createRef<EffectComposerImpl>()

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref}>
            <WrappedEffectA />
            <WrappedEffectB />
            <WrappedEffectC />
          </EffectComposer>
        )
      )

      const composer = await waitForComposer(ref)

      expect(composer.passes).toHaveLength(2)
      expect(composer.passes[0]).toBeInstanceOf(RenderPass)
      expect(composer.passes[1]).toBeInstanceOf(EffectPass)

      const effects = await waitForEffects(ref, 3)

      expect(effects[0]).toBeInstanceOf(EffectA)
      expect(effects[1]).toBeInstanceOf(EffectB)
      expect(effects[2]).toBeInstanceOf(EffectC)
    })

    it('preserves registration order on initial mount', async () => {
      const ref = React.createRef<EffectComposerImpl>()

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref}>
            <WrappedEffectC />
            <WrappedEffectA />
            <WrappedEffectB />
            <ColorAverage />
          </EffectComposer>
        )
      )

      const effects = await waitForEffects(ref, 4)

      expect(effects[0]).toBeInstanceOf(EffectC)
      expect(effects[1]).toBeInstanceOf(EffectA)
      expect(effects[2]).toBeInstanceOf(EffectB)
      expect(effects[3]).toBeInstanceOf(ColorAverageEffect)
    })

    it('keeps JSX registration order after the child list changes', async () => {
      const ref = React.createRef<EffectComposerImpl>()

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref}>
            <WrappedEffectC />
            <WrappedEffectA />
          </EffectComposer>
        )
      )

      let effects = await waitForEffects(ref, 2)

      expect(effects[0]).toBeInstanceOf(EffectC)
      expect(effects[1]).toBeInstanceOf(EffectA)

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref}>
            <WrappedEffectB />
            <WrappedEffectC />
          </EffectComposer>
        )
      )

      effects = await waitForEffects(ref, 2)

      expect(effects[0]).toBeInstanceOf(EffectB)
      expect(effects[1]).toBeInstanceOf(EffectC)
    })

    it('reorders effects when children swap positions in JSX, identity preserved via key', async () => {
      const ref = React.createRef<EffectComposerImpl>()

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref}>
            <WrappedEffectA key="a" />
            <WrappedEffectB key="b" />
          </EffectComposer>
        )
      )

      let effects = await waitForEffects(ref, 2)
      expect(effects[0]).toBeInstanceOf(EffectA)
      expect(effects[1]).toBeInstanceOf(EffectB)

      const [firstA, firstB] = effects

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref}>
            <WrappedEffectB key="b" />
            <WrappedEffectA key="a" />
          </EffectComposer>
        )
      )

      effects = await waitForEffects(ref, 2)

      expect(effects[0]).toBeInstanceOf(EffectB)
      expect(effects[1]).toBeInstanceOf(EffectA)
      // same underlying instances, just reordered — not a remount
      expect(effects[0]).toBe(firstB)
      expect(effects[1]).toBe(firstA)
    })

    it('keeps an effect in its slot when its instance is recreated via a prop-driven arg change', async () => {
      const ref = React.createRef<EffectComposerImpl>()

      class MiddleEffect extends Effect {
        value: number
        constructor({ value = 0 }: { value?: number } = {}) {
          super('MiddleEffect', EFFECT_SHADER)
          this.value = value
        }
      }
      const WrappedMiddle = wrapEffect(MiddleEffect)

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref}>
            <WrappedEffectA />
            <WrappedMiddle value={1} />
            <WrappedEffectC />
          </EffectComposer>
        )
      )

      let effects = await waitForEffects(ref, 3)
      expect(effects[0]).toBeInstanceOf(EffectA)
      expect(effects[1]).toBeInstanceOf(MiddleEffect)
      expect(effects[2]).toBeInstanceOf(EffectC)

      const firstMiddle = effects[1]

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref}>
            <WrappedEffectA />
            <WrappedMiddle value={2} />
            <WrappedEffectC />
          </EffectComposer>
        )
      )

      effects = await waitForEffects(ref, 3)

      expect(effects[0]).toBeInstanceOf(EffectA)
      expect(effects[1]).toBeInstanceOf(MiddleEffect)
      expect(effects[1]).not.toBe(firstMiddle) // recreated, new instance
      expect((effects[1] as InstanceType<typeof MiddleEffect>).value).toBe(2)
      expect(effects[2]).toBeInstanceOf(EffectC)
    })

    it('removes only the unmounted effect', async () => {
      const ref = React.createRef<EffectComposerImpl>()

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref}>
            <WrappedEffectA />
            <WrappedEffectB />
          </EffectComposer>
        )
      )

      await waitForEffects(ref, 2)

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref}>
            <WrappedEffectB />
          </EffectComposer>
        )
      )

      const effects = await waitForEffects(ref, 1)

      expect(effects[0]).toBeInstanceOf(EffectB)
    })

    it('accepts conditionally-rendered children via `condition && <Effect/>` without a type cast', async () => {
      const ref = React.createRef<EffectComposerImpl>()

      // Boxed behind a function so TS can't literal-narrow `show` to `false`
      // at the call site below — that would make `show && <WrappedEffectA/>`
      // type as just `false` instead of `boolean | Element`, silently
      // defeating the point of this test (a real regression to the old,
      // too-narrow `children: JSX.Element | JSX.Element[]` type wouldn't
      // get caught by tsc).
      const shouldShow = (value: boolean): boolean => value

      await React.act(async () =>
        root.render(<EffectComposer ref={ref}>{shouldShow(false) && <WrappedEffectA />}</EffectComposer>)
      )

      await flush()

      expect(ref.current!.passes.filter((p) => p instanceof EffectPass)).toHaveLength(0)

      await React.act(async () =>
        root.render(<EffectComposer ref={ref}>{shouldShow(true) && <WrappedEffectA />}</EffectComposer>)
      )

      const effects = await waitForEffects(ref, 1)

      expect(effects[0]).toBeInstanceOf(EffectA)
    })

    it('recreates the composer when the camera changes and keeps effects', async () => {
      const ref = React.createRef<EffectComposerImpl>()

      const cameraA = new THREE.PerspectiveCamera()
      const cameraB = new THREE.PerspectiveCamera()

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref} camera={cameraA}>
            <WrappedEffectA />
          </EffectComposer>
        )
      )

      const first = await waitForComposer(ref)

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref} camera={cameraB}>
            <WrappedEffectA />
          </EffectComposer>
        )
      )

      const second = await waitForComposer(ref)

      expect(second).not.toBe(first)

      const effects = await waitForEffects(ref, 1)

      expect(effects[0]).toBeInstanceOf(EffectA)
    })
  })

  describe('cleanup and disposal', () => {
    it('unregisters effects and clears the ref on full unmount', async () => {
      const ref = React.createRef<EffectComposerImpl>()

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref}>
            <WrappedEffectA />
          </EffectComposer>
        )
      )

      await waitForComposer(ref)
      expect(ref.current!.passes).toHaveLength(2)

      await React.act(async () => root.render(null))

      expect(ref.current).toBe(null)
    })

    it('does not leak composer instances in StrictMode', async () => {
      const disposeSpy = vi.spyOn(EffectComposerImpl.prototype, 'dispose')
      const ref = React.createRef<EffectComposerImpl>()

      await React.act(async () =>
        root.render(
          strict(
            <EffectComposer ref={ref}>
              <WrappedEffectA />
            </EffectComposer>
          )
        )
      )

      await waitForComposer(ref)

      await React.act(async () => {
        root.render(null)
      })

      expect(disposeSpy).toHaveBeenCalled()

      disposeSpy.mockRestore()
    })

    it('removes passes before disposing the composer, not after', async () => {
      const ref = React.createRef<EffectComposerImpl>()

      const removePassSpy = vi.spyOn(EffectComposerImpl.prototype, 'removePass')
      const disposeSpy = vi.spyOn(EffectComposerImpl.prototype, 'dispose')

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref}>
            <WrappedEffectA />
            <WrappedEffectB />
          </EffectComposer>
        )
      )

      await waitForEffects(ref, 2)

      removePassSpy.mockClear()
      disposeSpy.mockClear()

      await React.act(async () => {
        root.render(null)
      })

      expect(removePassSpy).toHaveBeenCalled()
      expect(disposeSpy).toHaveBeenCalled()

      const lastRemovePassOrder = Math.max(...removePassSpy.mock.invocationCallOrder)
      const disposeOrder = disposeSpy.mock.invocationCallOrder[0]

      expect(lastRemovePassOrder).toBeLessThan(disposeOrder)

      removePassSpy.mockRestore()
      disposeSpy.mockRestore()
    })

    it('disposes exactly as many composers as it constructs, across repeated prop changes', async () => {
      const ref = React.createRef<EffectComposerImpl>()
      const disposeSpy = vi.spyOn(EffectComposerImpl.prototype, 'dispose')
      const seenInstances = new Set<EffectComposerImpl>()
      const cycles = 20

      for (let i = 0; i < cycles; i++) {
        await React.act(async () =>
          root.render(
            <EffectComposer ref={ref} multisampling={i % 2 === 0 ? 0 : 16}>
              <WrappedEffectA />
            </EffectComposer>
          )
        )
        seenInstances.add(await waitForComposer(ref))
      }

      await React.act(async () => root.render(null))

      expect(seenInstances.size).toBe(cycles)
      expect(disposeSpy).toHaveBeenCalledTimes(cycles)

      disposeSpy.mockRestore()
    })

    it('disposes a hand-constructed effect exactly once on unmount', async () => {
      const disposeSpy = vi.spyOn(ColorAverageEffect.prototype, 'dispose')
      const ref = React.createRef<EffectComposerImpl>()

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref}>
            <WrappedEffectA />
            <ColorAverage />
          </EffectComposer>
        )
      )

      await waitForComposer(ref)
      await React.act(async () => root.render(null))

      expect(disposeSpy).toHaveBeenCalledTimes(1)
      disposeSpy.mockRestore()
    })

    it('disposes exactly as many ColorAverage instances as it constructs, across repeated prop changes', async () => {
      const disposeSpy = vi.spyOn(ColorAverageEffect.prototype, 'dispose')
      const ref = React.createRef<ColorAverageEffect>()
      const seenInstances = new Set<ColorAverageEffect>()
      const cycles = 20

      try {
        for (let i = 0; i < cycles; i++) {
          await React.act(async () =>
            root.render(
              <EffectComposer>
                <ColorAverage ref={ref} blendFunction={i % 2 === 0 ? BlendFunction.NORMAL : BlendFunction.ADD} />
              </EffectComposer>
            )
          )
          await flush()
          if (ref.current) seenInstances.add(ref.current)
        }

        await React.act(async () => root.render(null))

        expect(seenInstances.size).toBe(cycles)
        expect(disposeSpy).toHaveBeenCalledTimes(cycles)
      } finally {
        disposeSpy.mockRestore()
      }
    })

    it('never disposes the same ColorAverage instance twice, even in StrictMode', async () => {
      const disposedNodes: ColorAverageEffect[] = []
      const disposeSpy = vi.spyOn(ColorAverageEffect.prototype, 'dispose').mockImplementation(function (
        this: ColorAverageEffect
      ) {
        disposedNodes.push(this)
      })

      try {
        const ref = React.createRef<ColorAverageEffect>()
        for (let i = 0; i < 20; i++) {
          await React.act(async () =>
            root.render(
              strict(
                <EffectComposer>
                  <ColorAverage ref={ref} blendFunction={i % 2 === 0 ? BlendFunction.NORMAL : BlendFunction.ADD} />
                </EffectComposer>
              )
            )
          )
          await flush()
        }
        await React.act(async () => root.render(null))

        const uniqueDisposed = new Set(disposedNodes)
        expect(uniqueDisposed.size).toBe(disposedNodes.length)
      } finally {
        disposeSpy.mockRestore()
      }
    })
  })

  describe('renderer state restoration', () => {
    it('restores autoClear to its previous value once the composer is fully unmounted', async () => {
      const gl = root.render(null).getState().gl
      gl.autoClear = true // known baseline, independent of whatever earlier tests in this file left behind

      const ref = React.createRef<EffectComposerImpl>()

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref}>
            <WrappedEffectA />
          </EffectComposer>
        )
      )

      await waitForComposer(ref)
      expect(gl.autoClear).toBe(false)

      await React.act(async () => root.render(null))

      expect(gl.autoClear).toBe(true)
    })

    it('keeps autoClear disabled while a sibling composer on the same renderer is still mounted, regardless of unmount order', async () => {
      const gl = root.render(null).getState().gl
      gl.autoClear = true

      const refA = React.createRef<EffectComposerImpl>()
      const refB = React.createRef<EffectComposerImpl>()

      await React.act(async () =>
        root.render(
          <>
            <EffectComposer key="a" ref={refA}>
              <WrappedEffectA />
            </EffectComposer>
            <EffectComposer key="b" ref={refB}>
              <WrappedEffectB />
            </EffectComposer>
          </>
        )
      )

      await waitForComposer(refA)
      await waitForComposer(refB)
      expect(gl.autoClear).toBe(false)

      // Unmount the first composer only (key "a" drops out of the tree) -
      // the second is still relying on autoClear staying off, so this must
      // not restore it yet. Keying both is essential here: without it,
      // React would match by position and reuse "a"'s instance in place
      // (just updating its props to "b"'s), unmounting the wrong one.
      await React.act(async () =>
        root.render(
          <EffectComposer key="b" ref={refB}>
            <WrappedEffectB />
          </EffectComposer>
        )
      )

      expect(gl.autoClear).toBe(false)

      // Now the last one goes too - only now should it actually restore.
      await React.act(async () => root.render(null))

      expect(gl.autoClear).toBe(true)
    })

    it('restores toneMapping to its previous value once the composer is fully unmounted', async () => {
      const gl = root.render(null).getState().gl
      gl.toneMapping = THREE.ACESFilmicToneMapping // known baseline, distinct from NoToneMapping

      const ref = React.createRef<EffectComposerImpl>()

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref}>
            <WrappedEffectA />
          </EffectComposer>
        )
      )

      await waitForComposer(ref)
      expect(gl.toneMapping).toBe(THREE.NoToneMapping)

      await React.act(async () => root.render(null))

      expect(gl.toneMapping).toBe(THREE.ACESFilmicToneMapping)
    })

    it('keeps toneMapping disabled while a sibling composer on the same renderer is still mounted, regardless of unmount order', async () => {
      const gl = root.render(null).getState().gl
      gl.toneMapping = THREE.ACESFilmicToneMapping

      const refA = React.createRef<EffectComposerImpl>()
      const refB = React.createRef<EffectComposerImpl>()

      await React.act(async () =>
        root.render(
          <>
            <EffectComposer key="a" ref={refA}>
              <WrappedEffectA />
            </EffectComposer>
            <EffectComposer key="b" ref={refB}>
              <WrappedEffectB />
            </EffectComposer>
          </>
        )
      )

      await waitForComposer(refA)
      await waitForComposer(refB)
      expect(gl.toneMapping).toBe(THREE.NoToneMapping)

      // Unmount the first composer only - the second still relies on
      // toneMapping staying off, so this must not restore it yet.
      await React.act(async () =>
        root.render(
          <EffectComposer key="b" ref={refB}>
            <WrappedEffectB />
          </EffectComposer>
        )
      )

      expect(gl.toneMapping).toBe(THREE.NoToneMapping)

      // Now the last one goes too - only now should it actually restore.
      await React.act(async () => root.render(null))

      expect(gl.toneMapping).toBe(THREE.ACESFilmicToneMapping)
    })

    it('does not clobber a manual autoClear change made while the composer was mounted', async () => {
      const gl = root.render(null).getState().gl
      // Pre-mount baseline is false (not the usual true) specifically so
      // it differs from the manual override below - autoClear only has two
      // states, so this is the only way to make an unconditional restore-
      // to-original and a "preserve the manual change" outcome observably
      // different from each other.
      gl.autoClear = false

      const ref = React.createRef<EffectComposerImpl>()

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref}>
            <WrappedEffectA />
          </EffectComposer>
        )
      )

      await waitForComposer(ref)
      expect(gl.autoClear).toBe(false)

      // Something outside this component takes manual control while the
      // composer happens to still be mounted - a deliberate, more current
      // intent than whatever we captured before mount.
      gl.autoClear = true

      await React.act(async () => root.render(null))

      // Must stay what the manual override set it to, not get silently
      // reset back to the pre-mount value we originally captured (false).
      expect(gl.autoClear).toBe(true)
    })

    it('does not clobber a manual toneMapping change made while the composer was mounted', async () => {
      const gl = root.render(null).getState().gl
      gl.toneMapping = THREE.ACESFilmicToneMapping

      const ref = React.createRef<EffectComposerImpl>()

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref}>
            <WrappedEffectA />
          </EffectComposer>
        )
      )

      await waitForComposer(ref)
      expect(gl.toneMapping).toBe(THREE.NoToneMapping)

      gl.toneMapping = THREE.ReinhardToneMapping

      await React.act(async () => root.render(null))

      expect(gl.toneMapping).toBe(THREE.ReinhardToneMapping)
    })
  })

  describe('StrictMode', () => {
    it('preserves effects after the StrictMode fake-unmount/remount cycle', async () => {
      const ref = React.createRef<EffectComposerImpl>()

      await React.act(async () =>
        root.render(
          strict(
            <EffectComposer ref={ref}>
              <WrappedEffectA />
            </EffectComposer>
          )
        )
      )

      const firstComposer = await waitForComposer(ref)
      const effects = await waitForEffects(ref, 1)

      expect(firstComposer).toBeTruthy()
      expect(effects[0]).toBeInstanceOf(EffectA)

      await flush()

      const secondComposer = ref.current

      expect(secondComposer).toBeTruthy()
      expect(secondComposer!.passes).toHaveLength(2)

      const secondEffects = await waitForEffects(ref, 1)

      expect(secondEffects[0]).toBeInstanceOf(EffectA)
    })

    it('never creates duplicate EffectPass instances, including when effects are reduced', async () => {
      const ref = React.createRef<EffectComposerImpl>()

      await React.act(async () =>
        root.render(
          strict(
            <EffectComposer ref={ref}>
              <WrappedEffectA />
              <WrappedEffectB />
              <WrappedEffectC />
            </EffectComposer>
          )
        )
      )

      const composer = await waitForComposer(ref)
      const effects = await waitForEffects(ref, 3)

      expect(effects[0]).toBeInstanceOf(EffectA)
      expect(effects[1]).toBeInstanceOf(EffectB)
      expect(effects[2]).toBeInstanceOf(EffectC)
      expect(composer.passes.filter((p) => p instanceof EffectPass)).toHaveLength(1)

      await React.act(async () =>
        root.render(
          strict(
            <EffectComposer ref={ref}>
              <WrappedEffectA />
            </EffectComposer>
          )
        )
      )

      const reduced = await waitForEffects(ref, 1)

      expect(reduced[0]).toBeInstanceOf(EffectA)
      expect(composer.passes.filter((p) => p instanceof EffectPass)).toHaveLength(1)

      await React.act(async () => root.render(null))
      expect(ref.current).toBe(null)
    })
  })

  describe('composer recreation', () => {
    it('already has its EffectPass the instant the composer reference changes', async () => {
      const ref = React.createRef<EffectComposerImpl>()

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref} multisampling={4}>
            <WrappedEffectA />
          </EffectComposer>
        )
      )

      const firstComposer = await waitForComposer(ref)
      await waitForEffects(ref, 1)

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref} multisampling={8}>
            <WrappedEffectA />
          </EffectComposer>
        )
      )

      const secondComposer = await waitForNewComposer(ref, firstComposer)

      expect(secondComposer.passes.filter((p) => p instanceof EffectPass)).toHaveLength(1)
      // @ts-expect-error
      expect(secondComposer.passes.find((p) => p instanceof EffectPass)!.effects).toHaveLength(1)
    })

    it('preserves registration order across recreation with multiple effects', async () => {
      const ref = React.createRef<EffectComposerImpl>()

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref} multisampling={4}>
            <WrappedEffectC />
            <WrappedEffectA />
            <WrappedEffectB />
          </EffectComposer>
        )
      )

      const firstComposer = await waitForComposer(ref)
      await waitForEffects(ref, 3)

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref} multisampling={8}>
            <WrappedEffectC />
            <WrappedEffectA />
            <WrappedEffectB />
          </EffectComposer>
        )
      )

      const secondComposer = await waitForNewComposer(ref, firstComposer)
      // @ts-expect-error
      const effects = secondComposer.passes.find((p) => p instanceof EffectPass)!.effects

      expect(effects).toHaveLength(3)
      expect(effects[0]).toBeInstanceOf(EffectC)
      expect(effects[1]).toBeInstanceOf(EffectA)
      expect(effects[2]).toBeInstanceOf(EffectB)
    })

    it('enables normalPass/downSamplingPass synchronously on the new composer when effects are already registered', async () => {
      const ref = React.createRef<EffectComposerImpl>()

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref} multisampling={4} enableNormalPass resolutionScale={0.5}>
            <WrappedEffectA />
          </EffectComposer>
        )
      )

      const firstComposer = await waitForComposer(ref)
      await waitForEffects(ref, 1)

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref} multisampling={8} enableNormalPass resolutionScale={0.5}>
            <WrappedEffectA />
          </EffectComposer>
        )
      )

      const secondComposer = await waitForNewComposer(ref, firstComposer)

      const normalPass = secondComposer.passes.find((p) => p instanceof NormalPass)
      const downSamplingPass = secondComposer.passes.find((p) => p instanceof DepthDownsamplingPass)

      expect(normalPass).toBeTruthy()
      expect(downSamplingPass).toBeTruthy()
      expect(normalPass!.enabled).toBe(true)
      expect(downSamplingPass!.enabled).toBe(true)
    })

    it('leaves normalPass/downSamplingPass disabled when the composer is recreated before any effect has ever registered', async () => {
      const ref = React.createRef<EffectComposerImpl>()

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref} multisampling={4} enableNormalPass resolutionScale={0.5}>
            <></>
          </EffectComposer>
        )
      )

      const firstComposer = await waitForComposer(ref)

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref} multisampling={8} enableNormalPass resolutionScale={0.5}>
            <></>
          </EffectComposer>
        )
      )

      const secondComposer = await waitForNewComposer(ref, firstComposer)

      const normalPass = secondComposer.passes.find((p) => p instanceof NormalPass)
      const downSamplingPass = secondComposer.passes.find((p) => p instanceof DepthDownsamplingPass)

      expect(normalPass!.enabled).toBe(false)
      expect(downSamplingPass!.enabled).toBe(false)
      expect(secondComposer.passes.some((p) => p instanceof EffectPass)).toBe(false)
    })
  })

  describe('performance characteristics (documented, not enforced)', () => {
    it('rebuilds the EffectPass once per registration when mounting many effects at once', async () => {
      const addPassSpy = vi.spyOn(EffectComposerImpl.prototype, 'addPass')

      const ref = React.createRef<EffectComposerImpl>()
      const effectCount = 44

      await React.act(async () =>
        root.render(
          <EffectComposer ref={ref}>
            {Array.from({ length: effectCount }, (_, i) => (
              <WrappedEffectA key={i} />
            ))}
          </EffectComposer>
        )
      )

      await waitForEffects(ref, effectCount)

      const effectPassAddCalls = addPassSpy.mock.calls.filter(([pass]) => pass instanceof EffectPass).length

      expect(effectPassAddCalls).toBe(1)

      addPassSpy.mockRestore()
    })
  })
})
