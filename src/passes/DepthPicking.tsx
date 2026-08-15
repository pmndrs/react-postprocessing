import { useThree } from '@react-three/fiber'
import { CopyPass, DepthPickingPass as DepthPickingPassImpl } from 'postprocessing'
import { use, useCallback, useEffect, useImperativeHandle, useState, type Ref } from 'react'
import type { Camera } from 'three'
import { Vector2, Vector3 } from 'three'
import { EffectComposerContext } from '../EffectComposer'
import { useDispose } from '../util'

export type DepthPickingApi = {
  readDepth: (ndc: Vector2 | Vector3) => Promise<number>
}

export type DepthPickingProps = {
  ref?: Ref<DepthPickingApi>
}

// Mounts a vanilla `postprocessing` DepthPickingPass and exposes its
// `readDepth` via ref - nothing else. Renders nothing. Pair with
// `useDepthPicking` for a world-space position instead of raw depth.
export function DepthPicking({ ref }: DepthPickingProps) {
  const { composer } = use(EffectComposerContext)

  const [depthPickingPass] = useState(() => new DepthPickingPassImpl())
  const [copyPass] = useState(() => new CopyPass())
  useEffect(() => {
    composer.addPass(depthPickingPass)
    composer.addPass(copyPass)
    return () => {
      composer.removePass(depthPickingPass)
      composer.removePass(copyPass)
    }
  }, [composer, depthPickingPass, copyPass])

  useDispose(depthPickingPass)
  useDispose(copyPass)

  useImperativeHandle(ref, () => ({ readDepth: (ndc) => depthPickingPass.readDepth(ndc) }), [depthPickingPass])

  return null
}

export function useDepthPicking(pass: React.RefObject<DepthPickingApi | null>, camera?: Camera) {
  const composerCamera = use(EffectComposerContext)?.camera
  const defaultCamera = useThree((state) => state.camera)
  const resolvedCamera = camera ?? composerCamera ?? defaultCamera
  const [ndc] = useState(() => new Vector3())

  return useCallback(
    async (x: number, y: number): Promise<Vector3 | false> => {
      if (!pass.current) return false
      ndc.x = x
      ndc.y = y
      ndc.z = await pass.current.readDepth(ndc)
      ndc.z = ndc.z * 2.0 - 1.0
      const hit = 1 - ndc.z > 0.0000001 // missed if ndc.z is close to 1
      // clone - unproject mutates in place, and ndc is reused across calls,
      // so returning it directly would hand out a reference that changes
      // under the caller on the next pick.
      return hit ? ndc.clone().unproject(resolvedCamera) : false
    },
    [pass, resolvedCamera, ndc]
  )
}
