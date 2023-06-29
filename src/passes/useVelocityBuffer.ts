import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
// @ts-ignore
import { VelocityDepthNormalPass } from 'realism-effects'
import { useMemo, useLayoutEffect, useContext } from 'react'
import { EffectComposerContext } from '../EffectComposer'

export type VelocityBuffer = VelocityDepthNormalPass

const _buffers = new WeakMap<THREE.WebGLRenderer, VelocityBuffer>()

export function useVelocityBuffer(): VelocityBuffer {
  const gl = useThree((state) => state.gl)
  const { composer, camera, scene } = useContext(EffectComposerContext)

  const buffer = useMemo(() => {
    let _buffer = _buffers.get(gl)
    if (!_buffer) {
      _buffer = new VelocityDepthNormalPass(scene, camera)
      _buffers.set(gl, _buffer)
    }
    return _buffer
  }, [gl, scene, camera])

  useLayoutEffect(() => {
    let needsUpdate = !composer.passes.includes(buffer)
    if (needsUpdate) composer.addPass(buffer)

    return () => {
      if (needsUpdate) composer.removePass(buffer)
      buffer.dispose()
    }
  }, [composer, buffer])

  return buffer
}
