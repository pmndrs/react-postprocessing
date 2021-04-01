import { Circle } from '@react-three/drei'
import { EffectComposer, Noise, Vignette, HueSaturation, GodRays } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import React, { Suspense, forwardRef, useState } from 'react'
import { useControls } from 'leva'
import { Mesh } from 'three'

const Sun = forwardRef(function Sun(props, forwardRef) {
  const sunColor = useControls('sun color', { value: '#FF0000' })

  return (
    <Circle args={[10, 10]} ref={forwardRef} position={[0, 0, -16]}>
      <meshBasicMaterial color={sunColor} />
    </Circle>
  )
})

function Effects() {
  const [material, set] = useState<Mesh>()

  const { hue, saturation } = useControls('Postprocessing - HueSaturation', {
    hue: {
      value: 3.11,
      min: 0,
      max: Math.PI * 2,
    },
    saturation: {
      value: 2.05,
      min: 0,
      max: Math.PI * 2,
    },
  })

  const { noise } = useControls('Postprocessing - Noise', {
    noise: {
      value: 0.47,
      min: 0,
      max: 1,
    },
  })

  const { exposure, decay, blur } = useControls('PostProcessing - GodRays', {
    exposure: {
      value: 0.34,
      min: 0,
      max: 1,
    },
    decay: {
      value: 0.9,
      min: 0,
      max: 1,
      step: 0.1,
    },
    blur: {
      value: false,
    },
  })

  return (
    <Suspense fallback={null}>
      <Sun ref={material} />

      {material && (
        <EffectComposer multisampling={0}>
          <GodRays sun={material} exposure={exposure} decay={decay} blur={blur} />

          <Noise
            opacity={noise}
            premultiply // enables or disables noise premultiplication
            blendFunction={BlendFunction.ADD} // blend mode
          />

          <HueSaturation hue={hue} saturation={saturation} />

          <Vignette />
        </EffectComposer>
      )}
    </Suspense>
  )
}

export default Effects
