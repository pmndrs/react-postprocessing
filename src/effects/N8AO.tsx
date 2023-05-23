import { Ref, forwardRef, useLayoutEffect, useMemo } from 'react'
/* @ts-ignore */
import { N8AOPostPass } from 'n8ao'
import { useThree } from '@react-three/fiber'

type N8AOProps = {
  aoRadius?: number
  distanceFalloff?: number
  intensity?: number
}

export const N8AO = forwardRef<N8AOPostPass, N8AOProps>((props, ref: Ref<N8AOPostPass>) => {
  const { camera, scene, size } = useThree()
  const effect = useMemo(() => new N8AOPostPass(scene, camera, size.width, size.height), [])
  useLayoutEffect(() => {
    Object.assign(effect.configuration, props)
  }, [props])
  return <primitive ref={ref} object={effect} />
})