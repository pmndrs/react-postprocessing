import { useFrame, useThree } from '@react-three/fiber'
import {
  CopyPass,
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
  useReducer,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react'
import type { Camera, Group, Scene, TextureDataType, WebGLRenderer } from 'three'
import { HalfFloatType, NoToneMapping, Vector2 } from 'three'
import { readGroupChildren, updateIfChanged } from './util'

export const EffectComposerContext = /* @__PURE__ */ createContext<{
  composer: EffectComposerImpl
  normalPass: NormalPass | null
  downSamplingPass: DepthDownsamplingPass | null
  camera: Camera
  scene: Scene
  resolutionScale?: number
  // For descendants whose own Pass changes without re-rendering us (e.g. EffectGroup).
  requestRebuild: () => void
  autoClear: boolean
}>(null!)

export type EffectComposerProps = {
  enabled?: boolean
  children: ReactNode
  depthBuffer?: boolean
  /** Required by SSAO, leave it disabled otherwise. */
  enableNormalPass?: boolean
  stencilBuffer?: boolean
  autoClear?: boolean
  autoRenderToScreen?: boolean
  resolutionScale?: number
  multisampling?: number
  frameBufferType?: TextureDataType
  renderPriority?: number
  camera?: Camera
  scene?: Scene
  renderPass?: (scene: Scene, camera: Camera) => Pass
  mergeMode?: 'auto' | 'all' | 'none'
  ref?: Ref<EffectComposerImpl>
}

type ComposerState = {
  composer: EffectComposerImpl
  normalPass: NormalPass | null
  downSamplingPass: DepthDownsamplingPass | null
}

const isConvolution = (effect: Effect): boolean =>
  (effect.getAttributes() & EffectAttribute.CONVOLUTION) === EffectAttribute.CONVOLUTION

// mainUv isn't a bitflag - detect it the same way postprocessing itself does.
const hasMainUv = (effect: Effect): boolean => /mainUv/.test(effect.getFragmentShader() ?? '')

// Restores autoClear/toneMapping once the last composer on a renderer is gone.
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

// Shared scratch vector, only ever used synchronously.
const glSize = /* @__PURE__ */ new Vector2()

// Stable default - renderPass is a composer creation dep.
const defaultRenderPass = (scene: Scene, camera: Camera): Pass => new RenderPass(scene, camera)

// Passes built by buildPasses - user passes own their lifecycle.
const generatedPasses = /* @__PURE__ */ new WeakSet<Pass>()

// Passes that need the shared trailing CopyPass (EffectGroup, N8AO).
export const groupPasses = /* @__PURE__ */ new WeakSet<Pass>()

// EffectPass.dispose() would also dispose its effects, which have their own lifecycle.
export function disposePassWithoutEffects(pass: Pass): void {
  if (pass instanceof EffectPass) {
    ;(pass as unknown as { setEffects(effects: never[]): void }).setEffects([])
  }
  Pass.prototype.dispose.call(pass)
}

function disposeGeneratedPass(pass: Pass): void {
  if (!generatedPasses.has(pass)) return
  disposePassWithoutEffects(pass)
}

// 'auto' merges consecutive Effects but keeps convolution/mainUv apart (postprocessing
// throws if they mix), 'all' merges everything, 'none' never merges.
function buildPasses(nodes: Array<Effect | Pass>, camera: Camera, mergeMode: 'auto' | 'all' | 'none'): Pass[] {
  const passes: Pass[] = []

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]

    if (node instanceof Effect) {
      const effects: Effect[] = [node]
      let hasConvolution = isConvolution(node)
      let hasMainUvEffect = hasMainUv(node)

      if (mergeMode !== 'none') {
        let next: Effect | Pass | undefined
        while ((next = nodes[i + 1]) instanceof Effect) {
          const nextIsConvolution = isConvolution(next)
          const nextHasMainUv = hasMainUv(next)
          if (
            mergeMode === 'auto' &&
            ((hasConvolution && nextIsConvolution) ||
              (hasConvolution && nextHasMainUv) ||
              (hasMainUvEffect && nextIsConvolution))
          ) {
            break
          }
          effects.push(next)
          hasConvolution ||= nextIsConvolution
          hasMainUvEffect ||= nextHasMainUv
          i++
        }
      }

      const pass = new EffectPass(camera, ...effects)
      generatedPasses.add(pass)
      passes.push(pass)
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
  autoRenderToScreen = true,
  depthBuffer,
  enableNormalPass,
  stencilBuffer,
  multisampling = 4,
  frameBufferType = HalfFloatType,
  renderPass = defaultRenderPass,
  mergeMode = 'auto',
  ref,
}: EffectComposerProps) {
  const { gl, scene: defaultScene, camera: defaultCamera } = useThree()
  const scene = _scene || defaultScene
  const camera = _camera || defaultCamera

  gl.getSize(glSize)

  // useMemo can't own WebGL resources - React may discard it without cleanup.
  const [composerState, setComposerState] = useState<ComposerState | null>(null)

  // Dispatch is stable across renders, so it never destabilizes `state` below.
  const [, requestRebuild] = useReducer((c: number) => c + 1, 0)

  useEffect(() => {
    autoClearGuard.acquire(gl, false)

    const effectComposer = new EffectComposerImpl(gl, { depthBuffer, stencilBuffer, multisampling, frameBufferType })

    effectComposer.autoRenderToScreen = autoRenderToScreen
    effectComposer.addPass(renderPass(scene, camera))

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

    effectComposer.setSize(glSize.width, glSize.height)

    const ownPasses = new Set(effectComposer.passes)

    setComposerState({ composer: effectComposer, normalPass, downSamplingPass })

    return () => {
      // Detach passes not created here, dispose() would kill ones the new composer reuses.
      for (const pass of [...effectComposer.passes]) {
        if (ownPasses.has(pass)) continue
        effectComposer.removePass(pass)
        disposeGeneratedPass(pass)
      }
      effectComposer.dispose()
      autoClearGuard.release(gl)
    }
    // glSize is applied in useFrame, it shouldn't recreate the composer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    camera,
    gl,
    depthBuffer,
    stencilBuffer,
    multisampling,
    frameBufferType,
    autoRenderToScreen,
    renderPass,
    scene,
    enableNormalPass,
    resolutionScale,
  ])

  // Pixel ratio included - setDpr changes the drawing buffer but not gl.getSize().
  const appliedSizeRef = useRef({ width: -1, height: -1, pixelRatio: -1 })

  useFrame(
    (_, delta) => {
      if (!enabled || !composerState) return
      const { composer } = composerState

      gl.getSize(glSize)
      const pixelRatio = gl.getPixelRatio()
      const applied = appliedSizeRef.current
      if (glSize.width !== applied.width || glSize.height !== applied.height || pixelRatio !== applied.pixelRatio) {
        composer.setSize(glSize.width, glSize.height)
        applied.width = glSize.width
        applied.height = glSize.height
        applied.pixelRatio = pixelRatio
      }

      const currentAutoClear = gl.autoClear
      gl.autoClear = autoClear
      if (stencilBuffer && !autoClear) gl.clearStencil()
      composer.render(delta)
      gl.autoClear = currentAutoClear
    },
    enabled ? renderPriority : 0
  )

  // Read from the r3f scene graph so order always matches JSX, even through wrappers.
  const group = useRef<Group>(null!)
  const nodesRef = useRef<Array<Effect | Pass>>([])
  const [nodesVersion, setNodesVersion] = useState(0)

  // Runs every render, bumps nodesVersion only when the node list changed.
  useLayoutEffect(() => {
    if (!composerState) return
    const nodes = readGroupChildren(
      group.current,
      (object): object is Effect | Pass => object instanceof Effect || object instanceof Pass
    )
    if (updateIfChanged(nodesRef, nodes)) setNodesVersion((v) => v + 1)
  })

  useLayoutEffect(() => {
    if (!composerState) return
    const { composer, normalPass, downSamplingPass } = composerState

    const passes = buildPasses(nodesRef.current, camera, mergeMode)

    // renderToScreen goes by position, not `.enabled` - without this, a disabled
    // group at the end would leave the screen empty.
    if (passes.some((pass) => groupPasses.has(pass))) {
      const trailingCopyPass = new CopyPass()
      generatedPasses.add(trailingCopyPass)
      passes.push(trailingCopyPass)
    }

    for (const pass of passes) composer.addPass(pass)

    if (passes.length) {
      if (normalPass) normalPass.enabled = true
      if (downSamplingPass) downSamplingPass.enabled = true
    }

    return () => {
      for (const pass of passes) {
        composer.removePass(pass)
        disposeGeneratedPass(pass)
      }
      if (normalPass) normalPass.enabled = false
      if (downSamplingPass) downSamplingPass.enabled = false
    }
  }, [composerState, nodesVersion, camera, mergeMode])

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
            requestRebuild,
            autoClear,
          }
        : null,
    [composerState, resolutionScale, camera, scene, requestRebuild, autoClear]
  )

  // Expose the composer
  useImperativeHandle(ref, () => composerState?.composer as EffectComposerImpl, [composerState])

  // Children mount only once the composer exists, so context is never empty.
  if (!state) return null

  return (
    <EffectComposerContext.Provider value={state}>
      <group ref={group}>{children}</group>
    </EffectComposerContext.Provider>
  )
})
