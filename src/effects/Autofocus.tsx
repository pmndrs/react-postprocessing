import { createPortal, useFrame, useThree, type Vector3 as R3FVector3 } from '@react-three/fiber'
import { easing } from 'maath'
import { DepthOfFieldEffect } from 'postprocessing'
import {
  Ref,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type RefObject,
} from 'react'
import { Mesh, Vector3 } from 'three'

import { DepthPicking, useDepthPicking, type DepthPickingApi } from '../passes/DepthPicking'
import { DepthOfField } from './DepthOfField'

export type AutofocusProps = Omit<ComponentProps<typeof DepthOfField>, 'ref'> & {
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
  const pickRef = useRef<DepthPickingApi>(null)
  const getHit = useDepthPicking(pickRef)
  const hitpointMarkerRef = useRef<Mesh>(null)
  const dofTargetMarkerRef = useRef<Mesh>(null)

  const scene = useThree(({ scene }) => scene)
  const pointer = useThree(({ pointer }) => pointer)

  // A stable non-null value, purely to enable DepthOfField's own autoFocus
  // mode (`target != null`) - the actual per-frame value is applied
  // imperatively to dofRef.current.target below.
  const [autoFocusMarker] = useState(() => new Vector3())
  const [hitpoint] = useState(() => new Vector3())

  const update = useCallback(
    async (delta: number, updateTarget = true) => {
      if (target) {
        hitpoint.set(...(target as unknown as [number, number, number]))
      } else {
        const { x, y } = followMouse ? pointer : { x: 0, y: 0 }
        const hit = await getHit(x, y)
        if (hit) hitpoint.copy(hit)
      }

      if (updateTarget && dofRef.current?.target) {
        if (smoothTime > 0 && delta > 0) {
          easing.damp3(dofRef.current.target, hitpoint, smoothTime, delta)
        } else {
          dofRef.current.target.copy(hitpoint)
        }
      }
    },
    [target, hitpoint, followMouse, pointer, getHit, smoothTime]
  )

  useFrame((_, delta) => {
    if (!manual) {
      update(delta)
    }
    if (hitpointMarkerRef.current) {
      hitpointMarkerRef.current.position.copy(hitpoint)
    }
    if (dofTargetMarkerRef.current && dofRef.current?.target) {
      dofTargetMarkerRef.current.position.copy(dofRef.current.target)
    }
  })

  // Ref API
  const api = useMemo<AutofocusApi>(() => ({ dofRef, hitpoint, update }), [hitpoint, update])
  useImperativeHandle(ref, () => api, [api])

  return (
    <>
      <DepthPicking ref={pickRef} />

      {debug
        ? createPortal(
            <>
              <mesh ref={hitpointMarkerRef}>
                <sphereGeometry args={[debug, 16, 16]} />
                <meshBasicMaterial color="#00ff00" opacity={1} transparent depthWrite={false} />
              </mesh>
              <mesh ref={dofTargetMarkerRef}>
                <sphereGeometry args={[debug / 2, 16, 16]} />
                <meshBasicMaterial color="#00ff00" opacity={0.5} transparent depthWrite={false} />
              </mesh>
            </>,
            scene
          )
        : null}

      <DepthOfField ref={dofRef} {...props} target={autoFocusMarker} />
    </>
  )
}
