import { forwardRef, useContext, useEffect, useMemo } from 'react'
import { VelocityBuffer, useVelocityBuffer } from './useVelocityBuffer'
import { EffectPass } from 'postprocessing'
// @ts-ignore
import { MotionBlurEffect } from 'realism-effects'
import { EffectComposerContext } from '../EffectComposer'

export class MotionBlurPass extends EffectPass {
  constructor(camera: THREE.Camera, velocityBuffer: VelocityBuffer) {
    super(camera, new MotionBlurEffect(velocityBuffer))
  }
}

export interface MotionBlurProps extends Partial<MotionBlurPass> {}

export const MotionBlur = forwardRef<MotionBlurPass, MotionBlurProps>(function MotionBlur(props, ref) {
  const velocityBuffer = useVelocityBuffer()
  const { camera } = useContext(EffectComposerContext)
  const effect = useMemo(() => new MotionBlurPass(camera, velocityBuffer), [camera, velocityBuffer])
  useEffect(() => {
    return () => {
      effect.dispose()
    }
  }, [effect])

  return <primitive {...props} ref={ref} object={effect} />
})
