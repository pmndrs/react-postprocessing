// Generic smoke coverage for every effect component: mounts inside a real
// EffectComposer with the minimum props each one actually requires, confirms
// mounting/unmounting doesn't throw, and that dispose() gets called exactly
// once per instance on unmount (for both <primitive>-based effects, via our
// useDispose hook, and wrapEffect-based ones, via r3f's own auto-dispose).
//
// This catches constructor/prop-application/dispose-time crashes — it does
// NOT verify visual/shader correctness. The test environment's WebGL context
// is a Proxy of no-ops (see test-utils.tsx), so nothing actually renders;
// effects still need manual/visual verification before release.
//
// Coverage is enforced by the last test in this file: every *.tsx file in
// src/effects or src/passes must appear either in SMOKE_CASES or EXCLUDED
// below. Adding a new effect/pass file without touching either list fails CI.
//
// This file is excluded from `tsc -p tsconfig.json` (it matches
// src/**/*.test.*), so editors fall back to a detached/inferred compilation
// context for it that doesn't automatically pick up @types/node — hence the
// explicit reference below for the node: imports used by the coverage check.

/// <reference types="node" />

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DepthPickingPass as DepthPickingPassImpl, EffectComposer as EffectComposerImpl } from 'postprocessing'
import * as React from 'react'
import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { EffectComposer } from '../EffectComposer'
import { Autofocus } from '../effects/Autofocus'
import { Bloom } from '../effects/Bloom'
import { BrightnessContrast } from '../effects/BrightnessContrast'
import { ChromaticAberration } from '../effects/ChromaticAberration'
import { ColorAverage } from '../effects/ColorAverage'
import { ColorDepth } from '../effects/ColorDepth'
import { Depth } from '../effects/Depth'
import { DepthOfField } from '../effects/DepthOfField'
import { DotScreen } from '../effects/DotScreen'
import { FXAA } from '../effects/FXAA'
import { Glitch } from '../effects/Glitch'
import { GodRays } from '../effects/GodRays'
import { Grid } from '../effects/Grid'
import { HueSaturation } from '../effects/HueSaturation'
import { LensFlare } from '../effects/LensFlare'
import { LUT } from '../effects/LUT'
import { Noise } from '../effects/Noise'
import { Outline } from '../effects/Outline'
import { Pixelation } from '../effects/Pixelation'
import { Ramp } from '../effects/Ramp'
import { Scanline } from '../effects/ScanlineEffect'
import { SelectiveBloom } from '../effects/SelectiveBloom'
import { Sepia } from '../effects/Sepia'
import { ShockWave } from '../effects/ShockWave'
import { SMAA } from '../effects/SMAA'
import { SSAO } from '../effects/SSAO'
import { TiltShift } from '../effects/TiltShift'
import { TiltShift2 } from '../effects/TiltShift2'
import { ToneMapping } from '../effects/ToneMapping'
import { Vignette } from '../effects/Vignette'
import { WaterEffect } from '../effects/Water'
import { DepthPicking } from '../passes/DepthPicking'
import { N8AO } from '../passes/N8AO'
import { flush, root } from './test-utils'

type SmokeCase = {
  /** Filename under src/effects or src/passes this case covers — drives the coverage check below. */
  file: string
  label: string
  composerProps?: Record<string, unknown>
  /** Extra scene content the effect needs (e.g. a sun mesh for GodRays). */
  extras?: React.ReactNode
  /** Renders the effect element. */
  effect: (ref: React.Ref<any>) => React.ReactElement
}

const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8))
const lutTexture = new THREE.DataTexture(new Uint8Array(4 * 4 * 4 * 4), 4, 4)

const SMOKE_CASES: SmokeCase[] = [
  { file: 'Autofocus.tsx', label: 'Autofocus', effect: (ref) => <Autofocus ref={ref} /> },
  { file: 'Bloom.tsx', label: 'Bloom', effect: (ref) => <Bloom ref={ref} /> },
  { file: 'BrightnessContrast.tsx', label: 'BrightnessContrast', effect: (ref) => <BrightnessContrast ref={ref} /> },
  { file: 'ChromaticAberration.tsx', label: 'ChromaticAberration', effect: (ref) => <ChromaticAberration ref={ref} /> },
  { file: 'ColorAverage.tsx', label: 'ColorAverage', effect: (ref) => <ColorAverage ref={ref} /> },
  { file: 'ColorDepth.tsx', label: 'ColorDepth', effect: (ref) => <ColorDepth ref={ref} /> },
  { file: 'Depth.tsx', label: 'Depth', effect: (ref) => <Depth ref={ref} /> },
  { file: 'DepthOfField.tsx', label: 'DepthOfField', effect: (ref) => <DepthOfField ref={ref} /> },
  { file: 'DepthPicking.tsx', label: 'DepthPicking', effect: (ref) => <DepthPicking ref={ref} /> },
  { file: 'DotScreen.tsx', label: 'DotScreen', effect: (ref) => <DotScreen ref={ref} /> },
  { file: 'FXAA.tsx', label: 'FXAA', effect: (ref) => <FXAA ref={ref} /> },
  { file: 'Glitch.tsx', label: 'Glitch', effect: (ref) => <Glitch ref={ref} /> },
  {
    file: 'GodRays.tsx',
    label: 'GodRays',
    extras: <primitive object={sunMesh} />,
    effect: (ref) => <GodRays ref={ref} sun={sunMesh} />,
  },
  { file: 'Grid.tsx', label: 'Grid', effect: (ref) => <Grid ref={ref} /> },
  { file: 'HueSaturation.tsx', label: 'HueSaturation', effect: (ref) => <HueSaturation ref={ref} /> },
  { file: 'LensFlare.tsx', label: 'LensFlare', effect: (ref) => <LensFlare ref={ref} /> },
  { file: 'LUT.tsx', label: 'LUT', effect: (ref) => <LUT ref={ref} lut={lutTexture} /> },
  { file: 'N8AO.tsx', label: 'N8AO', effect: (ref) => <N8AO ref={ref} /> },
  { file: 'Noise.tsx', label: 'Noise', effect: (ref) => <Noise ref={ref} /> },
  { file: 'Outline.tsx', label: 'Outline', effect: (ref) => <Outline ref={ref} /> },
  { file: 'Pixelation.tsx', label: 'Pixelation', effect: (ref) => <Pixelation ref={ref} /> },
  { file: 'Ramp.tsx', label: 'Ramp', effect: (ref) => <Ramp ref={ref} /> },
  { file: 'ScanlineEffect.tsx', label: 'Scanline', effect: (ref) => <Scanline ref={ref} /> },
  {
    file: 'SelectiveBloom.tsx',
    label: 'SelectiveBloom',
    effect: (ref) => <SelectiveBloom ref={ref} lights={[]} />,
  },
  { file: 'Sepia.tsx', label: 'Sepia', effect: (ref) => <Sepia ref={ref} /> },
  { file: 'ShockWave.tsx', label: 'ShockWave', effect: (ref) => <ShockWave ref={ref} /> },
  { file: 'SMAA.tsx', label: 'SMAA', effect: (ref) => <SMAA ref={ref} /> },
  {
    file: 'SSAO.tsx',
    label: 'SSAO (without normal pass — sentinel path)',
    effect: (ref) => <SSAO ref={ref} />,
  },
  {
    file: 'SSAO.tsx',
    label: 'SSAO (with normal pass — real construction path)',
    composerProps: { enableNormalPass: true },
    effect: (ref) => <SSAO ref={ref} />,
  },
  { file: 'TiltShift.tsx', label: 'TiltShift', effect: (ref) => <TiltShift ref={ref} /> },
  { file: 'TiltShift2.tsx', label: 'TiltShift2', effect: (ref) => <TiltShift2 ref={ref} /> },
  { file: 'ToneMapping.tsx', label: 'ToneMapping', effect: (ref) => <ToneMapping ref={ref} /> },
  { file: 'Vignette.tsx', label: 'Vignette', effect: (ref) => <Vignette ref={ref} /> },
  { file: 'Water.tsx', label: 'WaterEffect', effect: (ref) => <WaterEffect ref={ref} /> },
]

const EXCLUDED: Record<string, string> = {
  'Texture.tsx':
    'loads via useLoader(TextureLoader, textureSrc) — needs a real image decode pipeline this test environment cannot provide. Verify manually.',
  'ASCII.tsx':
    "constructs its character atlas via document.createElement('canvas') — this project's vitest config runs the node test environment (no jsdom/document). Verify manually.",
}

describe('effect smoke tests', () => {
  it.each(SMOKE_CASES)('$label mounts and unmounts without throwing', async ({ composerProps, extras, effect }) => {
    const ref = React.createRef<any>()
    const composerRef = React.createRef<EffectComposerImpl>()

    await React.act(async () =>
      root.render(
        <EffectComposer ref={composerRef} {...composerProps}>
          {extras}
          {effect(ref)}
        </EffectComposer>
      )
    )

    await flush()

    const instance = ref.current
    const disposeSpy = instance && typeof instance.dispose === 'function' ? vi.spyOn(instance, 'dispose') : null

    await React.act(async () => root.render(null))
    await flush()

    if (disposeSpy) {
      expect(disposeSpy).toHaveBeenCalledTimes(1)
    }
  })

  // Autofocus's ref resolves to { dofRef, hitpoint, update }, not an effect
  // instance - the generic dispose check above no-ops for it. It owns two
  // disposables (the nested DepthPicking component's pass, and the
  // nested DepthOfField effect), verified here.
  it('Autofocus disposes the nested DepthPicking and DepthOfField effect', async () => {
    const depthPickingDisposeSpy = vi.spyOn(DepthPickingPassImpl.prototype, 'dispose')
    // AutofocusProps' `ref` type is broken (ComponentProps<typeof DepthOfField>
    // drags in DepthOfField's own `ref: Ref<DepthOfFieldEffect>`, which then
    // intersects with `Ref<AutofocusApi>` — separate pre-existing issue,
    // not fixed here). `any` sidesteps it; the runtime shape is AutofocusApi.
    const ref = React.createRef<any>()

    await React.act(async () =>
      root.render(
        <EffectComposer>
          <Autofocus ref={ref} />
        </EffectComposer>
      )
    )

    await flush()

    const dofEffect = ref.current!.dofRef.current
    expect(dofEffect).toBeTruthy()
    const dofDisposeSpy = vi.spyOn(dofEffect!, 'dispose')

    await React.act(async () => root.render(null))
    await flush()

    expect(depthPickingDisposeSpy).toHaveBeenCalled()
    expect(dofDisposeSpy).toHaveBeenCalled()

    depthPickingDisposeSpy.mockRestore()
  })

  it('DepthPicking disposes its pass on unmount', async () => {
    const disposeSpy = vi.spyOn(DepthPickingPassImpl.prototype, 'dispose')
    const ref = React.createRef<import('../passes/DepthPicking').DepthPickingApi>()

    await React.act(async () =>
      root.render(
        <EffectComposer>
          <DepthPicking ref={ref} />
        </EffectComposer>
      )
    )

    await flush()
    expect(ref.current).toBeTruthy()

    await React.act(async () => root.render(null))
    await flush()

    expect(disposeSpy).toHaveBeenCalled()

    disposeSpy.mockRestore()
  })

  it('covers every file in src/effects and src/passes (or documents why it is excluded)', () => {
    const srcDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
    const files = ['effects', 'passes'].flatMap((dir) =>
      fs.readdirSync(path.join(srcDir, dir)).filter((f) => f.endsWith('.tsx'))
    )

    const covered = new Set(SMOKE_CASES.map((c) => c.file))
    const missing = files.filter((f) => !covered.has(f) && !(f in EXCLUDED))

    expect(missing).toEqual([])
  })
})
