import { BlendFunction, Effect, EffectAttribute } from 'postprocessing'
import type { Ref } from 'react'
import { Uniform } from 'three'
import { createEffectComponent } from '../createEffectComponent'

const WaterShader = {
  fragmentShader: /* glsl */ `
    uniform float factor;

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      vec2 vUv = uv;
      float frequency = 6.0 * factor;
      float amplitude = 0.015 * factor;
      float x = vUv.y * frequency + time * 0.7;
      float y = vUv.x * frequency + time * 0.3;
      vUv.x += cos(x + y) * amplitude * cos(y);
      vUv.y += sin(x - y) * amplitude * cos(y);
      vec4 rgba = texture(inputBuffer, vUv);
      outputColor = rgba;
    }
  `,
}

export class WaterEffectImpl extends Effect {
  constructor({ blendFunction = BlendFunction.NORMAL, factor = 0 } = {}) {
    super('WaterEffect', WaterShader.fragmentShader, {
      blendFunction,
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform<number>>([['factor', new Uniform(factor)]]),
    })
  }

  get factor(): number {
    return this.uniforms.get('factor')!.value
  }

  set factor(value: number) {
    this.uniforms.get('factor')!.value = value
  }
}

export type WaterEffectProps = {
  blendFunction?: BlendFunction
  factor?: number
  ref?: Ref<WaterEffectImpl>
}

export const WaterEffect = /* @__PURE__ */ createEffectComponent<typeof WaterEffectImpl, WaterEffectProps>(
  WaterEffectImpl
)
