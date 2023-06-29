import { forwardRef, useContext, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { EffectPass } from 'postprocessing'
// @ts-ignore
import { TRAAEffect } from 'realism-effects'
import { VelocityBuffer, useVelocityBuffer } from './useVelocityBuffer'
import { EffectComposerContext } from '../EffectComposer'

export class TRAAPass extends EffectPass {
  constructor(scene: THREE.Scene, camera: THREE.Camera, velocityBuffer: VelocityBuffer) {
    super(camera, new TRAAEffect(scene, camera, velocityBuffer))
  }
}

export interface TRAAProps extends Partial<TRAAPass> {}

export const TRAA = forwardRef<TRAAPass, TRAAProps>(function TRAA(props, ref) {
  const { scene, camera } = useContext(EffectComposerContext)
  const velocityBuffer = useVelocityBuffer()
  const effect = useMemo(() => new TRAAPass(scene, camera, velocityBuffer), [scene, camera, velocityBuffer])
  useEffect(() => {
    return () => {
      effect.dispose()
    }
  }, [effect])

  return <primitive {...props} ref={ref} object={effect} />
})
