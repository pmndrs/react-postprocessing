import { createPortal, useFrame, useThree, type Vector3 as R3FVector3 } from '@react-three/fiber'
import { easing } from 'maath'
import { CopyPass, DepthOfFieldEffect, DepthPickingPass } from 'postprocessing'
import {
  Ref,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type RefObject,
} from 'react'
import { Mesh, Vector3 } from 'three'

import { EffectComposerContext } from '../EffectComposer'
import { DepthOfField } from './DepthOfField'

// EffectComposerImpl.dispose() disposes every pass it currently holds —
// including these two, since they're added via composer.addPass below.
// When Autofocus unmounts alongside its ancestor EffectComposer (e.g. a
// full tree unmount), both the composer's own teardown AND this
// component's cleanup effect would dispose the same instances. Wrapping
// dispose here makes it safe no matter which caller gets there first.
function makeDisposeIdempotent<T extends { dispose: () => void }>(instance: T): T {
  let disposed = false
  const dispose = instance.dispose.bind(instance)
  instance.dispose = () => {
    if (disposed) return
    disposed = true
    dispose()
  }
  return instance
}

export type AutofocusProps = ComponentProps<typeof DepthOfField> & {
  target?: R3FVector3
  /** should the target follow the pointer */
  mouse?: boolean
  /** size of the debug green point  */
  debug?: number
  /** manual update */
  manual?: boolean
  /** approximate time to reach the target */
  smoothTime?: number
  ref?: Ref<AutofocusApi>
}

export type AutofocusApi = {
  dofRef: RefObject<DepthOfFieldEffect | null>
  hitpoint: Vector3
  update: (delta: number, updateTarget: boolean) => void
}

export function Autofocus({
  target = undefined,
  mouse: followMouse = false,
  debug = undefined,
  manual = false,
  smoothTime = 0.25,
  ref,
  ...props
}: AutofocusProps) {
  const dofRef = useRef<DepthOfFieldEffect>(null)
  const hitpointRef = useRef<Mesh>(null)
  const targetRef = useRef<Mesh>(null)

  const scene = useThree(({ scene }) => scene)
  const pointer = useThree(({ pointer }) => pointer)
  const { composer, camera } = useContext(EffectComposerContext)

  // see: https://codesandbox.io/s/depthpickingpass-x130hg
  const [depthPickingPass] = useState(() => makeDisposeIdempotent(new DepthPickingPass()))
  const [copyPass] = useState(() => makeDisposeIdempotent(new CopyPass()))
  useEffect(() => {
    composer.addPass(depthPickingPass)
    composer.addPass(copyPass)
    return () => {
      composer.removePass(depthPickingPass)
      composer.removePass(copyPass)
    }
  }, [composer, depthPickingPass, copyPass])

  useEffect(() => {
    return () => {
      depthPickingPass.dispose()
      copyPass.dispose()
    }
  }, [depthPickingPass, copyPass])

  const [hitpoint] = useState(() => new Vector3(0, 0, 0))

  const [ndc] = useState(() => new Vector3(0, 0, 0))
  const getHit = useCallback(
    async (x: number, y: number) => {
      ndc.x = x
      ndc.y = y
      ndc.z = await depthPickingPass.readDepth(ndc)
      ndc.z = ndc.z * 2.0 - 1.0
      const hit = 1 - ndc.z > 0.0000001 // it is missed if ndc.z is close to 1
      return hit ? ndc.unproject(camera) : false
    },
    [ndc, depthPickingPass, camera]
  )

  const update = useCallback(
    async (delta: number, updateTarget = true) => {
      // Update hitpoint
      if (target) {
        hitpoint.set(...(target as unknown as [number, number, number]))
      } else {
        const { x, y } = followMouse ? pointer : { x: 0, y: 0 }
        const hit = await getHit(x, y)
        if (hit) hitpoint.copy(hit)
      }

      // Update target
      if (updateTarget && dofRef.current?.target) {
        if (smoothTime > 0 && delta > 0) {
          easing.damp3(dofRef.current.target, hitpoint, smoothTime, delta)
        } else {
          dofRef.current.target.copy(hitpoint)
        }
      }
    },
    [target, hitpoint, followMouse, getHit, smoothTime, pointer]
  )

  useFrame(async (_, delta) => {
    if (!manual) {
      update(delta)
    }
    if (hitpointRef.current) {
      hitpointRef.current.position.copy(hitpoint)
    }
    if (targetRef.current && dofRef.current?.target) {
      targetRef.current.position.copy(dofRef.current.target)
    }
  })

  // Ref API
  const api = useMemo<AutofocusApi>(
    () => ({
      dofRef,
      hitpoint,
      update,
    }),
    [hitpoint, update]
  )
  useImperativeHandle(ref, () => api, [api])

  return (
    <>
      {debug
        ? createPortal(
            <>
              <mesh ref={hitpointRef}>
                <sphereGeometry args={[debug, 16, 16]} />
                <meshBasicMaterial color="#00ff00" opacity={1} transparent depthWrite={false} />
              </mesh>
              <mesh ref={targetRef}>
                <sphereGeometry args={[debug / 2, 16, 16]} />
                <meshBasicMaterial color="#00ff00" opacity={0.5} transparent depthWrite={false} />
              </mesh>
            </>,
            scene
          )
        : null}

      <DepthOfField ref={dofRef} {...props} target={hitpoint} />
    </>
  )
}
