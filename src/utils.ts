import { forwardRef, useMemo, useImperativeHandle, Props } from 'react'
import { useThree } from 'react-three-fiber'
import { Effect } from 'postprocessing'

export const wrapEffect = (effectImpl: any) => {
  return forwardRef((props: Props<Effect>, ref) => {
    const { camera } = useThree()

    const effect = useMemo(() => new effectImpl(camera, /* something here */ props), [props, camera]) as Effect

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
