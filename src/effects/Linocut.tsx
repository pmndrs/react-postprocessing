import type { ReactThreeFiber } from '@react-three/fiber'
import { BlendFunction, Effect } from 'postprocessing'
import type { Ref } from 'react'
import { Uniform, Vector2 } from 'three'
import { createEffectComponent } from '../createEffectComponent'

// Ported from TresJS post-processing (MIT), https://github.com/Tresjs/post-processing
const LinocutShader = {
  fragmentShader: /* glsl */ `
    uniform float scale;
    uniform float noiseScale;
    uniform vec2 center;
    uniform float rotation;

    float noise(const in vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      vec2 fragCoord = uv * resolution;
      vec2 d = fragCoord - center * resolution;
      d *= mat2(cos(rotation), -sin(rotation), sin(rotation), cos(rotation));

      // Swirled radial coordinates drive the carved line pattern
      float r = length(d) / (1000.0 / max(scale, 0.01));
      float a = atan(d.y, d.x) + scale * (0.5 - r) / 0.5;
      vec2 uvt = center * resolution + r * vec2(cos(a), sin(a));
      float c = 0.75 + 0.25 * sin(uvt.x * 1000.0 * max(scale, 0.01));

      // Input is already linear, so luma thresholds directly and the result stays linear
      float l = dot(inputColor.rgb, vec3(0.299, 0.587, 0.114));
      l += noiseScale * (noise(uv * 10.0) - 0.5);

      float f = smoothstep(0.5 * c, c, l);
      f = smoothstep(0.0, 0.5, f);

      outputColor = vec4(vec3(f), inputColor.a);
    }
  `,
}

export class LinocutEffect extends Effect {
  constructor({
    blendFunction = BlendFunction.NORMAL,
    scale = 0.85,
    noiseScale = 0,
    center = new Vector2(0.5, 0.5),
    rotation = 0,
  } = {}) {
    super('LinocutEffect', LinocutShader.fragmentShader, {
      blendFunction,
      uniforms: new Map<string, Uniform>([
        ['scale', new Uniform(scale)],
        ['noiseScale', new Uniform(noiseScale)],
        ['center', new Uniform(center)],
        ['rotation', new Uniform(rotation)],
      ]),
    })
  }

  /** Line width and swirl amount, 0 to 1. */
  get scale(): number {
    return this.uniforms.get('scale')!.value
  }

  set scale(value: number) {
    this.uniforms.get('scale')!.value = value
  }

  /** Noise added before thresholding, 0 to 1. */
  get noiseScale(): number {
    return this.uniforms.get('noiseScale')!.value
  }

  set noiseScale(value: number) {
    this.uniforms.get('noiseScale')!.value = value
  }

  /** Center of the line pattern in normalized screen coordinates. */
  get center(): Vector2 {
    return this.uniforms.get('center')!.value
  }

  set center(value: Vector2) {
    this.uniforms.get('center')!.value = value
  }

  /** Rotation of the line pattern in radians. */
  get rotation(): number {
    return this.uniforms.get('rotation')!.value
  }

  set rotation(value: number) {
    this.uniforms.get('rotation')!.value = value
  }
}

export type LinocutProps = {
  blendFunction?: BlendFunction
  opacity?: number
  scale?: number
  noiseScale?: number
  center?: ReactThreeFiber.Vector2
  rotation?: number
  ref?: Ref<LinocutEffect>
}

export const Linocut = /* @__PURE__ */ createEffectComponent<typeof LinocutEffect, LinocutProps>(LinocutEffect)
