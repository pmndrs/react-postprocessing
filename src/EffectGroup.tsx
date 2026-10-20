import { Effect, EffectPass } from 'postprocessing'
import { use, useImperativeHandle, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from 'react'
import type { Group } from 'three'
import { disposePassWithoutEffects, EffectComposerContext, groupPasses } from './EffectComposer'
import { readGroupChildren, updateIfChanged } from './util'

export type EffectGroupProps = {
  /** Toggles the whole pass, like Pass.enabled in vanilla postprocessing - cheap, no reconstruction. */
  enabled?: boolean
  children: ReactNode
  ref?: Ref<EffectPass>
}

// Children go into a hidden <group> that EffectComposer's walk skips, and the
// combined pass is rendered back at this component's JSX position.
export function EffectGroup({ enabled = true, children, ref }: EffectGroupProps) {
  const { camera, scene, requestRebuild } = use(EffectComposerContext)

  const group = useRef<Group>(null!)
  const effectsRef = useRef<Effect[]>([])
  const [pass, setPass] = useState<EffectPass | null>(null)

  // Fresh pass on every effect list change (like buildPasses), so addPass() does all the setup.
  useLayoutEffect(() => {
    const effects = readGroupChildren(group.current, (object): object is Effect => object instanceof Effect)
    if (!updateIfChanged(effectsRef, effects)) return

    if (!effects.length) {
      setPass(null)
      return
    }

    const newPass = new EffectPass(camera, ...effects)
    groupPasses.add(newPass)
    setPass(newPass)
  })

  // EffectComposer rebuilds its own passes on camera/scene change, this one is kept, so sync it here.
  useLayoutEffect(() => {
    if (!pass) return
    pass.mainCamera = camera
    pass.mainScene = scene
  }, [pass, camera, scene])

  // Layout effect so `enabled` is set before EffectComposer adds the pass.
  useLayoutEffect(() => {
    if (pass) pass.enabled = enabled
  }, [pass, enabled])

  // Local state changes don't re-render EffectComposer, so ask it to re-walk.
  useLayoutEffect(() => {
    requestRebuild()
  }, [pass, requestRebuild])

  // Disposes the replaced pass, or the last one on unmount.
  useLayoutEffect(() => {
    return () => {
      if (pass) disposePassWithoutEffects(pass)
    }
  }, [pass])

  useImperativeHandle(ref, () => pass as EffectPass, [pass])

  return (
    <>
      <group ref={group}>{children}</group>
      {pass && <primitive object={pass} />}
    </>
  )
}
