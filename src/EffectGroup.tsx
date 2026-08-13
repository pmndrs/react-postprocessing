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

// Groups its children into one EffectPass instead of relying on
// EffectComposer's automatic consecutive-effect merging. Renders children
// into a hidden inner <group> (invisible to EffectComposer's own top-level
// walk) and renders the resulting pass back out via <primitive> at this
// component's own JSX position, so EffectComposer's existing bare-Pass
// passthrough places it correctly relative to sibling effects.
export function EffectGroup({ enabled = true, children, ref }: EffectGroupProps) {
  const { camera, requestRebuild } = use(EffectComposerContext)

  const group = useRef<Group>(null!)
  const effectsRef = useRef<Effect[]>([])
  const [pass, setPass] = useState<EffectPass | null>(null)

  // Mirrors EffectComposer's own buildPasses: always constructs a fresh
  // EffectPass when the effect list changes, rather than updating one in
  // place - so composer.addPass() runs its normal setSize/initialize dance
  // for every effect, with nothing to replicate by hand here.
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

  // useLayoutEffect (not useEffect) so `enabled` is applied before
  // EffectComposer's own effect adds this pass to the composer.
  useLayoutEffect(() => {
    if (pass) pass.enabled = enabled
  }, [pass, enabled])

  // A local state update above doesn't re-render EffectComposer, so its own
  // tree walk would never notice this pass appearing/disappearing.
  useLayoutEffect(() => {
    requestRebuild()
  }, [pass, requestRebuild])

  // Disposes whichever pass this replaces (or the last one, on unmount) -
  // the only place a pass gets disposed, so there's no double-dispose risk
  // from also doing it inline above where `pass` is replaced.
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
