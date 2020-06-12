import { OutlineEffect } from 'postprocessing'
import { forwardRef, useMemo, useImperativeHandle, ForwardRefExoticComponent } from 'react'
import { useThree } from 'react-three-fiber'

type OutlineProps = ConstructorParameters<typeof OutlineEffect>[2]

export const Outline: ForwardRefExoticComponent<OutlineEffect> = forwardRef((props: OutlineProps, ref) => {
  const { scene, camera } = useThree()

  const effect = useMemo(
    () =>
      new OutlineEffect(scene, camera, {
        xRay: true,
        edgeStrength: 2.5,
        pulseSpeed: 0.0,
        visibleEdgeColor: 0xffffff,
        hiddenEdgeColor: 0x22090a,
        ...props,
      }),
    [props]
  )

  useImperativeHandle(ref, () => effect, [effect])
  return null
})
