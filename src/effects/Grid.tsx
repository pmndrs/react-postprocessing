import { useThree } from '@react-three/fiber'
import { GridEffect } from 'postprocessing'
import { type Ref, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { createEffectComponent, type EffectOptions } from '../createEffectComponent'

const GridImpl = /* @__PURE__ */ createEffectComponent<typeof GridEffect, EffectOptions<typeof GridEffect>>(GridEffect)

export type GridProps = EffectOptions<typeof GridEffect> & {
  size?: { width: number; height: number }
  opacity?: number
  ref?: Ref<GridEffect>
}

export function Grid({ size, ref, ...props }: GridProps) {
  const invalidate = useThree((state) => state.invalidate)
  const localRef = useRef<GridEffect>(null)
  useImperativeHandle(ref, () => localRef.current!, [])

  useLayoutEffect(() => {
    if (size) {
      localRef.current?.setSize(size.width, size.height)
      invalidate()
    }
  }, [size, invalidate])

  return <GridImpl ref={localRef} {...props} />
}
