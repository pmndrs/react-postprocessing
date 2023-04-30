import * as THREE from 'three'
import React, {
  useRef,
  useContext,
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  RefObject,
} from 'react'
import { useThree, useFrame, createPortal } from '@react-three/fiber'
import { CopyPass, DepthPickingPass } from 'postprocessing'
import { DepthOfField, EffectComposerContext } from './index'
import { DepthOfFieldEffect } from 'postprocessing'
import { easing } from 'maath'

export type AutofocusProps = typeof DepthOfField & {
  target?: [number, number, number]
  mouse?: boolean
  debug?: number
  manual?: boolean
  smoothTime?: number
}

export type AutofocusApi = {
  dofRef: RefObject<DepthOfFieldEffect>
  hitpoint: THREE.Vector3
  update: (delta: number, updateTarget: boolean) => void
}

export const Autofocus = forwardRef<AutofocusApi, AutofocusProps>(
  (
    { target = undefined, mouse: followMouse = false, debug = undefined, manual = false, smoothTime = 0, ...props },
    fref
  ) => {
    const dofRef = useRef<DepthOfFieldEffect>(null)
    const hitpointRef = useRef<THREE.Mesh>(null)
    const targetRef = useRef<THREE.Mesh>(null)

    const { size, gl, scene } = useThree()
    const { composer, camera } = useContext(EffectComposerContext)

    // see: https://codesandbox.io/s/depthpickingpass-x130hg
    const [depthPickingPass] = useState(new DepthPickingPass())
    useEffect(() => {
      const copyPass = new CopyPass()
      composer.addPass(depthPickingPass)
      composer.addPass(copyPass)
      return () => {
        composer.removePass(copyPass)
        composer.removePass(depthPickingPass)
      }
    }, [composer, depthPickingPass])

    const [hitpoint] = useState(new THREE.Vector3(0, 0, 0))

    const [ndc] = useState(new THREE.Vector3(0, 0, 0))
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

    const [pointer] = useState(new THREE.Vector2())
    useEffect(() => {
      if (!followMouse) return

      async function onPointermove(e: PointerEvent) {
        const clientX = e.clientX - size.left
        const clientY = e.clientY - size.top
        const x = (clientX / size.width) * 2.0 - 1.0
        const y = -(clientY / size.height) * 2.0 + 1.0

        pointer.set(x, y)
      }
      gl.domElement.addEventListener('pointermove', onPointermove, {
        passive: true,
      })

      return () => void gl.domElement.removeEventListener('pointermove', onPointermove)
    }, [gl.domElement, hitpoint, size, followMouse, getHit, pointer])

    const update = useCallback(
      async (delta: number, updateTarget = true) => {
        // Update hitpoint
        if (target) {
          hitpoint.set(...target)
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
      if (manual) return
      update(delta)
    })

    useFrame(() => {
      if (hitpointRef.current) {
        hitpointRef.current.position.copy(hitpoint)
      }
      if (targetRef.current && dofRef.current?.target) {
        targetRef.current.position.copy(dofRef.current.target)
      }
    })

    // Ref API
    useImperativeHandle(
      fref,
      () => ({
        dofRef,
        hitpoint,
        update,
      }),
      [hitpoint, update]
    )

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
)
