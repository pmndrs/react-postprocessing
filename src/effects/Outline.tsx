import { OutlineEffect } from 'postprocessing'
import { Ref, RefObject, use, useEffect, useMemo } from 'react'
import { Color, Object3D, type ColorRepresentation } from 'three'
import { EffectComposerContext } from '../EffectComposer'
import { applyPierced, EMPTY_ARRAY, readPierced, useDispose, useLiveDefaults, useSelectionSync } from '../util'

type ObjectRef = RefObject<Object3D | null>

type OutlineEffectOptions = NonNullable<ConstructorParameters<typeof OutlineEffect>[2]>

export type OutlineProps = Omit<OutlineEffectOptions, 'visibleEdgeColor' | 'hiddenEdgeColor'> &
  Partial<{
    selection: Object3D | Object3D[] | ObjectRef | ObjectRef[]
    selectionLayer: number
    visibleEdgeColor: ColorRepresentation
    hiddenEdgeColor: ColorRepresentation
    ref?: Ref<OutlineEffect>
  }>

// Every OutlineEffect option that has a real setter (verified against
// postprocessing's source) - resolutionScale/resolutionX/resolutionY are
// the only ones without one, since they only feed the internal blur pass
// at construction time. scene/camera are required constructor args, so
// OutlineEffect can't use createEffectComponent (needs `new Effect()` to
// work with zero args) - built by hand instead.
const LIVE_KEYS = [
  'patternTexture',
  'patternScale',
  'edgeStrength',
  'pulseSpeed',
  'visibleEdgeColor',
  'hiddenEdgeColor',
  'multisampling',
  'width',
  'height',
  'kernelSize',
  'blur',
  'xRay',
  'dithering',
  'blendMode-blendFunction',
]

// The setter stores whatever it's given as-is, unlike the constructor -
// wrap in a Color here too, or a raw hex/string breaks the shader uniform.
function set(effect: OutlineEffect, key: string, value: unknown): void {
  if (key === 'visibleEdgeColor' || key === 'hiddenEdgeColor') applyPierced(effect, key, new Color(value as never))
  else applyPierced(effect, key, value)
}

export function Outline({
  selection = EMPTY_ARRAY,
  selectionLayer = 10,
  blendFunction,
  resolutionScale,
  resolutionX,
  resolutionY,
  ref,
  ...liveProps
}: OutlineProps) {
  const { scene, camera, autoClear } = use(EffectComposerContext)

  const effect = useMemo(
    () => new OutlineEffect(scene, camera, { resolutionScale, resolutionX, resolutionY }),
    [scene, camera, resolutionScale, resolutionX, resolutionY]
  )

  useEffect(() => {
    if (autoClear !== false) {
      console.warn('Outline requires <EffectComposer autoClear={false}> to render correctly.')
    }
  }, [autoClear])

  useLiveDefaults(
    effect,
    { ...liveProps, 'blendMode-blendFunction': blendFunction } as Record<string, unknown>,
    LIVE_KEYS,
    readPierced,
    set
  )
  useSelectionSync(effect, selection, selectionLayer)
  useDispose(effect)

  return <primitive ref={ref} object={effect} />
}
