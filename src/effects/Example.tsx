import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { BlendFunction, Effect } from 'postprocessing'

import { wrapEffect } from '../util'

//
// Effect
//

const ExampleShader = {
  fragment: `
    uniform vec3 color;
    uniform float time;
    
    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      outputColor = vec4(color, 0.5 + (cos(time) / 2.0 + 0.5));
    }
  `,
}

type ExampleEffectOptions = {
  /** The color for this effect */
  color: THREE.Color
  /** The blend function of this effect */
  blendFunction?: BlendFunction
}

export class ExampleEffect extends Effect {
  constructor({ color, blendFunction }: ExampleEffectOptions) {
    super('LensFlareEffect', ExampleShader.fragment, {
      blendFunction,
      uniforms: new Map<string, THREE.Uniform>([
        ['color', new THREE.Uniform(color)],
        ['time', new THREE.Uniform(0)],
      ]),
    })
  }

  update(_renderer: any, _inputBuffer: any, deltaTime: number) {
    const time = this.uniforms.get('time')
    if (time) {
      time.value += deltaTime
    }
  }
}

//
// Component
//

const ExampleWrapped = wrapEffect(ExampleEffect)

type ExampleProps = React.ComponentPropsWithoutRef<typeof ExampleWrapped> & {
  /** mouse */
  mouse?: boolean
}

export const Example = ({ mouse = false, ...props }: ExampleProps) => {
  const pointer = useThree(({ pointer }) => pointer)

  const ref = useRef<ExampleEffect>(null)

  useFrame(() => {
    if (!mouse) return
    if (!ref?.current) return

    const uColor = ref.current.uniforms.get('color')
    if (!uColor) return

    uColor.value.r = pointer.x / 2.0 + 0.5
    uColor.value.g = pointer.y / 2.0 + 0.5
  })

  return <ExampleWrapped ref={ref} {...props} />
}
