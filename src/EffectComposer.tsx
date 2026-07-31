import { useFrame, useThree, type Instance } from '@react-three/fiber'
import {
  DepthDownsamplingPass,
  Effect,
  EffectAttribute,
  EffectComposer as EffectComposerImpl,
  EffectPass,
  NormalPass,
  Pass,
  RenderPass,
} from 'postprocessing'
import {
  createContext,
  memo,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react'
import type { Camera, Group, Scene, TextureDataType, WebGLRenderer } from 'three'
import { HalfFloatType, NoToneMapping } from 'three'

export const EffectComposerContext = /* @__PURE__ */ createContext<{
  composer: EffectComposerImpl
  normalPass: NormalPass | null
  downSamplingPass: DepthDownsamplingPass | null
  camera: Camera
  scene: Scene
  resolutionScale?: number
}>(null!)

export type EffectComposerProps = {
  enabled?: boolean
  children: ReactNode
  depthBuffer?: boolean
  /** Only used for SSGI currently, leave it disabled for everything else unless it's needed */
  enableNormalPass?: boolean
  stencilBuffer?: boolean
  autoClear?: boolean
  resolutionScale?: number
  multisampling?: number
  frameBufferType?: TextureDataType
  renderPriority?: number
  camera?: Camera
  scene?: Scene
  ref?: Ref<EffectComposerImpl>
}

type ComposerState = {
  composer: EffectComposerImpl
  normalPass: NormalPass | null
  downSamplingPass: DepthDownsamplingPass | null
}

const isConvolution = (effect: Effect): boolean =>
  (effect.getAttributes() & EffectAttribute.CONVOLUTION) === EffectAttribute.CONVOLUTION

/**
 * autoClear/toneMapping get force-set and never restored by whoever sets
 * them. Ref-counted per (renderer, property) since composers can share a
 * renderer; skips restoring if the value already changed since acquire.
 */
function createRendererPropertyGuard<K extends 'autoClear' | 'toneMapping'>(property: K) {
  const refs = new WeakMap<
    WebGLRenderer,
    { count: number; original: WebGLRenderer[K]; forcedValue: WebGLRenderer[K] }
  >()

  return {
    acquire(gl: WebGLRenderer, forcedValue: WebGLRenderer[K]): void {
      const existing = refs.get(gl)
      if (existing) {
        existing.count++
        existing.forcedValue = forcedValue
      } else {
        refs.set(gl, { count: 1, original: gl[property], forcedValue })
      }
    },
    release(gl: WebGLRenderer): void {
      const entry = refs.get(gl)
      if (!entry) return

      if (--entry.count <= 0) {
        if (gl[property] === entry.forcedValue) {
          gl[property] = entry.original
        }
        refs.delete(gl)
      }
    },
  }
}

const autoClearGuard = /* @__PURE__ */ createRendererPropertyGuard('autoClear')
const toneMappingGuard = /* @__PURE__ */ createRendererPropertyGuard('toneMapping')

/**
 * Groups a flat, ordered list of Effect/Pass instances into actual composer
 * passes, merging consecutive non-convolution Effects into a single
 * EffectPass.
 */
function buildPasses(nodes: Array<Effect | Pass>, camera: Camera): Pass[] {
  const passes: Pass[] = []

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]

    if (node instanceof Effect) {
      const effects: Effect[] = [node]

      if (!isConvolution(node)) {
        let next: Effect | Pass | undefined
        while ((next = nodes[i + 1]) instanceof Effect) {
          if (isConvolution(next)) break
          effects.push(next)
          i++
        }
      }

      passes.push(new EffectPass(camera, ...effects))
    } else if (node instanceof Pass) {
      passes.push(node)
    }
  }

  return passes
}

export const EffectComposer = /* @__PURE__ */ memo(function EffectComposer({
  children,
  camera: _camera,
  scene: _scene,
  resolutionScale,
  enabled = true,
  renderPriority = 1,
  autoClear = true,
  depthBuffer,
  enableNormalPass,
  stencilBuffer,
  multisampling = 8,
  frameBufferType = HalfFloatType,
  ref,
}: EffectComposerProps) {
  const { gl, scene: defaultScene, camera: defaultCamera, size } = useThree()
  const scene = _scene || defaultScene
  const camera = _camera || defaultCamera

  // EffectComposer owns WebGL resources, so it must be created and
  // disposed inside an effect lifecycle. useMemo is not suitable here
  // because React may discard memoized values without running cleanup.
  const [composerState, setComposerState] = useState<ComposerState | null>(null)

  useEffect(() => {
    autoClearGuard.acquire(gl, false)

    const effectComposer = new EffectComposerImpl(gl, { depthBuffer, stencilBuffer, multisampling, frameBufferType })
    effectComposer.addPass(new RenderPass(scene, camera))

    let normalPass: NormalPass | null = null
    let downSamplingPass: DepthDownsamplingPass | null = null

    if (enableNormalPass) {
      normalPass = new NormalPass(scene, camera)
      normalPass.enabled = false
      effectComposer.addPass(normalPass)

      if (resolutionScale !== undefined) {
        downSamplingPass = new DepthDownsamplingPass({ normalBuffer: normalPass.texture, resolutionScale })
        downSamplingPass.enabled = false
        effectComposer.addPass(downSamplingPass)
      }
    }

    effectComposer.setSize(size.width, size.height)

    setComposerState({ composer: effectComposer, normalPass, downSamplingPass })

    return () => {
      effectComposer.dispose()
      autoClearGuard.release(gl)
    }
    // `size` intentionally excluded: it's applied via the composer.setSize
    // effect below, and shouldn't tear down/recreate the whole composer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, gl, depthBuffer, stencilBuffer, multisampling, frameBufferType, scene, enableNormalPass, resolutionScale])

  useEffect(() => {
    composerState?.composer.setSize(size.width, size.height)
  }, [composerState, size])

  useFrame(
    (_, delta) => {
      if (!enabled || !composerState) return
      const { composer } = composerState
      const currentAutoClear = gl.autoClear
      gl.autoClear = autoClear
      if (stencilBuffer && !autoClear) gl.clearStencil()
      composer.render(delta)
      gl.autoClear = currentAutoClear
    },
    enabled ? renderPriority : 0
  )

  // Passes are derived from the actual r3f scene graph rather than tracked
  // incrementally, so the list always matches current JSX order — including
  // through wrapper components — even after a reorder or a remount.
  const group = useRef<Group>(null!)

  useLayoutEffect(() => {
    if (!composerState) return
    const { composer, normalPass, downSamplingPass } = composerState

    const passes: Pass[] = []
    const groupInstance = (group.current as Group & { __r3f: Instance<Group> }).__r3f

    if (groupInstance) {
      const nodes = groupInstance.children.map((child) => child.object).filter(
        (object): object is Effect | Pass => object instanceof Effect || object instanceof Pass
      )

      passes.push(...buildPasses(nodes, camera))
    }

    for (const pass of passes) composer.addPass(pass)

    if (passes.length) {
      if (normalPass) normalPass.enabled = true
      if (downSamplingPass) downSamplingPass.enabled = true
    }

    return () => {
      for (const pass of passes) composer.removePass(pass)
      if (normalPass) normalPass.enabled = false
      if (downSamplingPass) downSamplingPass.enabled = false
    }
  }, [composerState, children, camera])

  // Disable tone mapping because threejs disallows tonemapping on render targets
  useEffect(() => {
    toneMappingGuard.acquire(gl, NoToneMapping)
    gl.toneMapping = NoToneMapping
    return () => {
      toneMappingGuard.release(gl)
    }
  }, [gl])

  // Memoize state, otherwise it would trigger all consumers on every render
  const state = useMemo(
    () =>
      composerState
        ? {
            composer: composerState.composer,
            normalPass: composerState.normalPass,
            downSamplingPass: composerState.downSamplingPass,
            resolutionScale,
            camera,
            scene,
          }
        : null,
    [composerState, resolutionScale, camera, scene]
  )

  // Expose the composer
  useImperativeHandle(ref, () => composerState?.composer as EffectComposerImpl, [composerState])

  // Wait until the composer exists before mounting children so they always
  // see a valid composer instance via context.
  if (!state) return null

  return (
    <EffectComposerContext.Provider value={state}>
      <group ref={group}>{children}</group>
    </EffectComposerContext.Provider>
  )
})
