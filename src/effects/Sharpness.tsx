import { BlendFunction, Effect, EffectAttribute } from 'postprocessing'
import type { Ref } from 'react'
import { Uniform } from 'three'
import { createEffectComponent } from '../createEffectComponent'

const SharpnessShader = {
  fragmentShader: /* glsl */ `
    uniform float sharpness;
    uniform float radius;

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      vec2 dx = vec2(texelSize.x * radius, 0.0);
      vec2 dy = vec2(0.0, texelSize.y * radius);

      vec3 center = texture2D(inputBuffer, uv).rgb;
      vec3 neighbors = texture2D(inputBuffer, uv - dx).rgb
        + texture2D(inputBuffer, uv + dx).rgb
        + texture2D(inputBuffer, uv - dy).rgb
        + texture2D(inputBuffer, uv + dy).rgb;

      // Laplacian sharpen, sharpness 1 is the classic 5 / -1 kernel
      vec3 color = center + sharpness * (4.0 * center - neighbors);
      outputColor = vec4(max(color, 0.0), inputColor.a);
    }
  `,
}

export class SharpnessEffect extends Effect {
  constructor({ blendFunction = BlendFunction.NORMAL, sharpness = 1, radius = 1 } = {}) {
    super('SharpnessEffect', SharpnessShader.fragmentShader, {
      blendFunction,
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform<number>>([
        ['sharpness', new Uniform(sharpness)],
        ['radius', new Uniform(radius)],
      ]),
    })
  }

  /** Sharpening strength, 0 disables it. */
  get sharpness(): number {
    return this.uniforms.get('sharpness')!.value
  }

  set sharpness(value: number) {
    this.uniforms.get('sharpness')!.value = value
  }

  /** Distance to the sampled neighbors in pixels. */
  get radius(): number {
    return this.uniforms.get('radius')!.value
  }

  set radius(value: number) {
    this.uniforms.get('radius')!.value = value
  }
}

export type SharpnessProps = {
  blendFunction?: BlendFunction
  opacity?: number
  sharpness?: number
  radius?: number
  ref?: Ref<SharpnessEffect>
}

export const Sharpness = /* @__PURE__ */ createEffectComponent<typeof SharpnessEffect, SharpnessProps>(SharpnessEffect)
