import { BlendFunction, Effect, EffectAttribute } from 'postprocessing'
import type { Ref } from 'react'
import { Uniform } from 'three'
import { createEffectComponent } from '../createEffectComponent'

// Ported from three.js HalftoneShader (MIT)
const HalftoneShader = {
  fragmentShader: /* glsl */ `
    uniform int shape;
    uniform float radius;
    uniform float rotateR;
    uniform float rotateG;
    uniform float rotateB;
    uniform float scatter;
    uniform bool greyscale;

    float rand(const in vec2 seed) {
      return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
    }

    // Color averaged around a dot center
    vec3 getSample(const in vec2 point) {
      vec3 color = texture2D(inputBuffer, point / resolution).rgb;
      float base = rand(floor(point)) * 6.28318531;
      float dist = radius * 0.66;

      for (int i = 0; i < 8; i++) {
        float a = base + 0.78539816 * float(i);
        color += texture2D(inputBuffer, (point + vec2(cos(a), sin(a)) * dist) / resolution).rgb;
      }

      return color / 9.0;
    }

    float distanceToDotRadius(float channel, vec2 coord, vec2 normal, vec2 p, float angle) {
      float dist = length(coord - p);
      float rad = clamp(channel, 0.0, 1.0);

      if (shape == 2) {
        // Ellipse
        rad = pow(rad, 1.125) * radius;
        if (dist != 0.0) {
          float dotP = abs(dot((p - coord) / dist, normal));
          dist = dist * (1.0 - 0.20710678) + dotP * dist * 0.41421356;
        }
      } else if (shape == 3) {
        // Line
        rad = pow(rad, 1.5) * radius;
        dist = abs(dot(p - coord, normal));
      } else if (shape == 4) {
        // Square
        float theta = atan(p.y - coord.y, p.x - coord.x) - angle;
        float sinT = abs(sin(theta));
        float cosT = abs(cos(theta));
        rad = pow(rad, 1.4);
        rad = radius * (rad + ((sinT > cosT) ? rad - sinT * rad : rad - cosT * rad));
      } else {
        // Dot
        rad = pow(rad, 1.125) * radius;
      }

      return rad - dist;
    }

    // Coverage of one channel's rotated dot grid at pixel p
    float halftoneChannel(vec2 p, float angle, int channel, float aa) {
      vec2 n = vec2(cos(angle), sin(angle));
      vec2 t = vec2(n.y, -n.x);
      float threshold = radius * 0.5;

      float dotNormal = dot(n, p);
      float dotLine = -n.y * p.x + n.x * p.y;
      vec2 offset = n * dotNormal;
      float offsetNormal = mod(length(offset), radius);
      float normalDir = (dotNormal < 0.0) ? 1.0 : -1.0;
      float normalScale = ((offsetNormal < threshold) ? -offsetNormal : radius - offsetNormal) * normalDir;
      float offsetLine = mod(length(p - offset), radius);
      float lineDir = (dotLine < 0.0) ? 1.0 : -1.0;
      float lineScale = ((offsetLine < threshold) ? -offsetLine : radius - offsetLine) * lineDir;

      // Closest grid corner, then the other three corners of the cell
      vec2 p1 = p - n * normalScale + t * lineScale;

      if (scatter != 0.0) {
        float offAngle = rand(floor(p1)) * 6.28318531;
        p1 += vec2(cos(offAngle), sin(offAngle)) * scatter * threshold * 0.5;
      }

      float normalStep = normalDir * ((offsetNormal < threshold) ? radius : -radius);
      float lineStep = lineDir * ((offsetLine < threshold) ? radius : -radius);
      vec2 p2 = p1 - n * normalStep;
      vec2 p3 = p1 + t * lineStep;
      vec2 p4 = p2 + t * lineStep;

      vec3 s1 = getSample(p1);
      vec3 s2 = getSample(p2);
      vec3 s3 = getSample(p3);
      vec3 s4 = getSample(p4);

      float res = clamp(distanceToDotRadius(s1[channel], p1, n, p, angle) / aa, 0.0, 1.0);
      res += clamp(distanceToDotRadius(s2[channel], p2, n, p, angle) / aa, 0.0, 1.0);
      res += clamp(distanceToDotRadius(s3[channel], p3, n, p, angle) / aa, 0.0, 1.0);
      res += clamp(distanceToDotRadius(s4[channel], p4, n, p, angle) / aa, 0.0, 1.0);

      return clamp(res, 0.0, 1.0);
    }

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      vec2 p = uv * resolution;
      float aa = (radius < 2.5) ? radius * 0.5 : 1.25;

      vec3 color = vec3(
        halftoneChannel(p, rotateR, 0, aa),
        halftoneChannel(p, rotateG, 1, aa),
        halftoneChannel(p, rotateB, 2, aa)
      );

      if (greyscale) color = vec3((color.r + color.g + color.b) / 3.0);

      outputColor = vec4(color, inputColor.a);
    }
  `,
}

export enum HalftoneShape {
  Dot = 1,
  Ellipse = 2,
  Line = 3,
  Square = 4,
}

export class HalftoneEffect extends Effect {
  constructor({
    blendFunction = BlendFunction.NORMAL,
    shape = HalftoneShape.Dot,
    radius = 4,
    rotateR = Math.PI / 12,
    rotateG = (Math.PI / 12) * 2,
    rotateB = (Math.PI / 12) * 3,
    scatter = 0,
    greyscale = false,
  } = {}) {
    super('HalftoneEffect', HalftoneShader.fragmentShader, {
      blendFunction,
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ['shape', new Uniform(shape)],
        ['radius', new Uniform(radius)],
        ['rotateR', new Uniform(rotateR)],
        ['rotateG', new Uniform(rotateG)],
        ['rotateB', new Uniform(rotateB)],
        ['scatter', new Uniform(scatter)],
        ['greyscale', new Uniform(greyscale)],
      ]),
    })
  }

  private u<T>(name: string): T {
    return this.uniforms.get(name)!.value
  }

  private setU(name: string, value: unknown): void {
    this.uniforms.get(name)!.value = value
  }

  /** Dot shape. */
  get shape(): HalftoneShape {
    return this.u('shape')
  }
  set shape(value: HalftoneShape) {
    this.setU('shape', value)
  }

  /** Dot grid spacing and maximum dot radius in pixels. */
  get radius(): number {
    return this.u('radius')
  }
  set radius(value: number) {
    this.setU('radius', value)
  }

  /** Rotation of the red channel grid in radians. */
  get rotateR(): number {
    return this.u('rotateR')
  }
  set rotateR(value: number) {
    this.setU('rotateR', value)
  }

  /** Rotation of the green channel grid in radians. */
  get rotateG(): number {
    return this.u('rotateG')
  }
  set rotateG(value: number) {
    this.setU('rotateG', value)
  }

  /** Rotation of the blue channel grid in radians. */
  get rotateB(): number {
    return this.u('rotateB')
  }
  set rotateB(value: number) {
    this.setU('rotateB', value)
  }

  /** Random dot offset, 0 to 1. */
  get scatter(): number {
    return this.u('scatter')
  }
  set scatter(value: number) {
    this.setU('scatter', value)
  }

  /** Renders the dots in greyscale. */
  get greyscale(): boolean {
    return this.u('greyscale')
  }
  set greyscale(value: boolean) {
    this.setU('greyscale', value)
  }
}

export type HalftoneProps = {
  blendFunction?: BlendFunction
  opacity?: number
  shape?: HalftoneShape
  radius?: number
  rotateR?: number
  rotateG?: number
  rotateB?: number
  scatter?: number
  greyscale?: boolean
  ref?: Ref<HalftoneEffect>
}

export const Halftone = /* @__PURE__ */ createEffectComponent<typeof HalftoneEffect, HalftoneProps>(HalftoneEffect)
