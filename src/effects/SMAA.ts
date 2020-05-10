import { SMAAEffect, SMAAImageLoader } from 'postprocessing'

import { forwardRef, useImperativeHandle, useMemo, ForwardRefExoticComponent } from 'react'
import { useLoader } from 'react-three-fiber'

const SMAA: ForwardRefExoticComponent<SMAAEffect> = forwardRef((props, ref) => {
  // @ts-ignore
  const smaaProps = useLoader(SMAAImageLoader, '')

  // @ts-ignore
  const effect = useMemo(() => new SMAAEffect(...smaaProps, ...props), [props])

  useImperativeHandle(
    ref,
    () => {
      return effect
    },
    [effect]
  )

  return null
})

export default SMAA
