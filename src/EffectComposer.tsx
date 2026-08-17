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
  // A child's local state update doesn't re-render its parent - descendants
  // that add/remove a bare Pass of their own (e.g. EffectGroup) call this
  // to make the tree walk below notice.
  requestRebuild: () => void
  autoClear: boolean
}>(null!)

export type EffectComposerProps = {
  enabled?: boolean
  children: ReactNode
  depthBuffer?: boolean
  /** Only used for SSGI currently, leave it disabled for everything else unless it's needed */
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

// autoClear/toneMapping get force-set and never restored. Ref-counted per
// (renderer, property) since composers can share a renderer.
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

// Scratch vector for gl.getSize() below - written then read synchronously
// within the same call, never held onto across a render/frame, so sharing
// one instance across every <EffectComposer> is safe (same reasoning as
// DEFAULT_SCREEN_RES in LensFlare.tsx: safe because nothing ever aliases it).
const glSize = /* @__PURE__ */ new Vector2()

// Stable identity for the `renderPass` default - it's in the creation
// effect's dependency array below (changing it recreates the composer,
// same as depthBuffer/multisampling), so a fresh arrow function every
// render here would recreate the composer on every render too.
const defaultRenderPass = (scene: Scene, camera: Camera): Pass => new RenderPass(scene, camera)

// Only passes buildPasses itself constructs - not a user's own bare Pass,
// which owns its own lifecycle.
const generatedPasses = /* @__PURE__ */ new WeakSet<Pass>()

// EffectGroup registers its pass here (see EffectGroup.tsx) so the rebuild
// effect below knows to add a shared trailing CopyPass.
export const groupPasses = /* @__PURE__ */ new WeakSet<Pass>()

// Not pass.dispose() - EffectPass.dispose() also disposes the effects it
// wraps, which have their own lifecycle. setEffects([]) detaches them first.
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

// 'auto' (default): consecutive Effects share one EffectPass, same as vanilla
// postprocessing allows by hand - a run may contain at most one convolution
// Effect (e.g. DepthOfField), since the library throws if two land in the
// same pass. 'all' merges through that limit too, same no-guardrail
// treatment EffectGroup already gives its own children - multiple
// convolution Effects in one run will throw at render time. 'none' gives
// every Effect its own EffectPass.
function buildPasses(nodes: Array<Effect | Pass>, camera: Camera, mergeMode: 'auto' | 'all' | 'none'): Pass[] {
  const passes: Pass[] = []

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]

    if (node instanceof Effect) {
      const effects: Effect[] = [node]
      let hasConvolution = isConvolution(node)

      if (mergeMode !== 'none') {
        let next: Effect | Pass | undefined
        while ((next = nodes[i + 1]) instanceof Effect) {
          const nextIsConvolution = isConvolution(next)
          if (mergeMode === 'auto' && hasConvolution && nextIsConvolution) break
          effects.push(next)
          hasConvolution ||= nextIsConvolution
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
  multisampling = 8,
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

    setComposerState({ composer: effectComposer, normalPass, downSamplingPass })

    return () => {
      // The rebuild effect below may not have detached its passes yet
      // (composerState only updates next render) - without this, dispose()
      // would kill effects the new composer is about to reuse.
      for (const pass of effectComposer.passes) disposeGeneratedPass(pass)
      effectComposer.dispose()
      autoClearGuard.release(gl)
    }
    // `glSize` intentionally excluded: it's applied via the composer.setSize
    // effect below, and shouldn't tear down/recreate the whole composer.
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

  // Last size actually applied to the composer, so the check below is a
  // cheap no-op on frames where nothing changed.
  const appliedSizeRef = useRef({ width: -1, height: -1 })

  useFrame(
    (_, delta) => {
      if (!enabled || !composerState) return
      const { composer } = composerState

      gl.getSize(glSize)
      if (glSize.width !== appliedSizeRef.current.width || glSize.height !== appliedSizeRef.current.height) {
        composer.setSize(glSize.width, glSize.height)
        appliedSizeRef.current.width = glSize.width
        appliedSizeRef.current.height = glSize.height
      }

      const currentAutoClear = gl.autoClear
      gl.autoClear = autoClear
      if (stencilBuffer && !autoClear) gl.clearStencil()
      composer.render(delta)
      gl.autoClear = currentAutoClear
    },
    enabled ? renderPriority : 0
  )

  // Derived from the r3f scene graph (not tracked incrementally) so order
  // always matches JSX, even through wrapper components or a reorder.
  const group = useRef<Group>(null!)
  const nodesRef = useRef<Array<Effect | Pass>>([])
  const [nodesVersion, setNodesVersion] = useState(0)

  // Runs every render, but only bumps nodesVersion (triggering the rebuild
  // below) when the resolved node list actually changed.
  useLayoutEffect(() => {
    if (!composerState) return
    const nodes = readGroupChildren(
      group.current,
      (object): object is Effect | Pass => object instanceof Effect || object instanceof Pass
    )
    if (updateIfChanged(nodesRef, nodes)) setNodesVersion((v) => v + 1)
  })

  // Only re-runs when nodesVersion/composerState/camera change - React's
  // own dependency bailout, so create/cleanup pairing stays correct.
  useLayoutEffect(() => {
    if (!composerState) return
    const { composer, normalPass, downSamplingPass } = composerState

    const passes = buildPasses(nodesRef.current, camera, mergeMode)

    // A toggleable pass (EffectGroup) sitting last would leave nothing on
    // screen once disabled - postprocessing assigns renderToScreen by
    // structural position, not `.enabled`. A shared trailing CopyPass
    // (always enabled, always added last) fixes that for the whole chain.
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

  // Wait until the composer exists before mounting children so they always
  // see a valid composer instance via context.
  if (!state) return null

  return (
    <EffectComposerContext.Provider value={state}>
      <group ref={group}>{children}</group>
    </EffectComposerContext.Provider>
  )
})
