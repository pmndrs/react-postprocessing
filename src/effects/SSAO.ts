import { forwardRef, useContext, useMemo, useImperativeHandle } from 'react'
import { useThree } from 'react-three-fiber'
import { SSAOEffect, BlendFunction } from 'postprocessing'
import { EffectComposerContext } from '../EffectComposer'

const SSAO = forwardRef((props, ref) => {
  const { camera } = useThree()
  const composer = useContext(EffectComposerContext)
  const effect = useMemo(
    () =>
      new SSAOEffect(camera, composer.normalPass.renderTarget.texture, {
        blendFunction: BlendFunction.MULTIPLY,
        samples: 30,
        rings: 4,
        distanceThreshold: 1.0,
        distanceFalloff: 0.0,
        rangeThreshold: 0.5,
        rangeFalloff: 0.1,
        luminanceInfluence: 0.9,
        radius: 20,
        scale: 0.5,
        bias: 0.5,
        ...props,
      }),
    [props]
  )
  useImperativeHandle(ref, () => effect, [effect])
  return null
})

export default SSAO
