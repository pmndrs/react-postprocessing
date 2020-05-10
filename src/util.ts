import { forwardRef, useImperativeHandle, useMemo } from 'react'
import { Effect } from 'postprocessing'

export const wrapEffect = (effectImpl: any) => {
  type Props = typeof effectImpl

  return forwardRef<Props, any>((props, ref) => {
    const effect = useMemo(() => new effectImpl(...props), [props])

    useImperativeHandle(
      ref,
      () => {
        return effect
      },
      [effect]
    )

    return null
  })
}
