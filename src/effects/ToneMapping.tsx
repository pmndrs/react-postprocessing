import { ToneMappingEffect, EffectAttribute } from 'postprocessing'
import { EffectProps } from '../util'
import { forwardRef, useEffect, useMemo } from 'react'

export type ToneMappingProps = EffectProps<typeof ToneMappingEffect>

export const ToneMapping = forwardRef<ToneMappingEffect, ToneMappingProps>(function ToneMapping(
  {
    blendFunction,
    adaptive,
    mode,
    resolution,
    maxLuminance,
    whitePoint,
    middleGrey,
    minLuminance,
    averageLuminance,
    adaptationRate,
    ...props
  },
  ref
) {
  const effect = useMemo(
    () =>
      new ToneMappingEffect({
        blendFunction,
        adaptive,
        mode,
        resolution,
        maxLuminance,
        whitePoint,
        middleGrey,
        minLuminance,
        averageLuminance,
        adaptationRate,
      }),
    [
      blendFunction,
      adaptive,
      mode,
      resolution,
      maxLuminance,
      whitePoint,
      middleGrey,
      minLuminance,
      averageLuminance,
      adaptationRate,
    ]
  )

  useEffect(() => {
    effect.dispose()
  }, [effect])

  return <primitive {...props} ref={ref} object={effect} attributes={EffectAttribute.CONVOLUTION} />
})
