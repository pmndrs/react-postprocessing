import { BlendFunction, Effect, EffectAttribute } from 'postprocessing'
import type { Ref } from 'react'
import { Uniform } from 'three'
import { createEffectComponent } from '../createEffectComponent'

// Anisotropic generalized Kuwahara filter, based on Kyprianidis et al. and
// https://blog.maximeheckel.com/posts/on-crafting-painterly-shaders/
const KuwaharaShader = {
  fragmentShader: /* glsl */ `
    uniform float radius;
    uniform int sectorCount;

    float luma(const in vec2 uv) {
      return dot(texture2D(inputBuffer, uv).rgb, vec3(0.299, 0.587, 0.114));
    }

    // Sobel-based structure tensor (Jxx, Jyy, Jxy), sampled wider for larger radii to smooth it
    vec3 structureTensor(const in vec2 uv) {
      vec2 d = texelSize * max(1.0, radius * 0.5);
      float tl = luma(uv + vec2(-d.x, d.y));
      float tc = luma(uv + vec2(0.0, d.y));
      float tr = luma(uv + d);
      float ml = luma(uv - vec2(d.x, 0.0));
      float mr = luma(uv + vec2(d.x, 0.0));
      float bl = luma(uv - d);
      float bc = luma(uv - vec2(0.0, d.y));
      float br = luma(uv + vec2(d.x, -d.y));
      float gx = (tr + 2.0 * mr + br) - (tl + 2.0 * ml + bl);
      float gy = (tl + 2.0 * tc + tr) - (bl + 2.0 * bc + br);
      return vec3(gx * gx, gy * gy, gx * gy);
    }

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      vec3 st = structureTensor(uv);
      float diff = st.x - st.y;
      float root = sqrt(diff * diff + 4.0 * st.z * st.z);
      float anisotropy = root / (st.x + st.y + 1e-7);
      float phi = 0.5 * atan(2.0 * st.z, diff + 1e-7);

      // Ellipse squeezed across the edge and stretched along it
      float c = cos(phi);
      float s = sin(phi);
      mat2 transform = mat2(c, s, -s, c) * mat2(1.0 / (1.0 + anisotropy), 0.0, 0.0, 1.0 + anisotropy);

      int count = clamp(sectorCount, 2, 8);
      float sectorAngle = 6.28318531 / float(count);
      vec3 center = texture2D(inputBuffer, uv).rgb;
      vec3 colorSum = vec3(0.0);
      float weightSum = 0.0;

      for (int i = 0; i < 8; i++) {
        if (i >= count) break;

        vec3 sum = center;
        vec3 sumSq = center * center;
        float n = 1.0;

        for (float r = 1.0; r <= radius; r += 1.0) {
          for (int k = 0; k < 3; k++) {
            float a = (float(i) + (float(k) + 0.5) / 3.0) * sectorAngle;
            vec2 offset = transform * (vec2(cos(a), sin(a)) * r) * texelSize;
            vec3 color = texture2D(inputBuffer, uv + offset).rgb;
            sum += color;
            sumSq += color * color;
            n += 1.0;
          }
        }

        vec3 mean = sum / n;
        vec3 variance = abs(sumSq / n - mean * mean);
        // Sectors with low variance dominate, which keeps edges sharp
        float weight = 1.0 / (1.0 + pow(255.0 * sqrt(variance.r + variance.g + variance.b), 4.0));
        colorSum += mean * weight;
        weightSum += weight;
      }

      outputColor = vec4(colorSum / weightSum, inputColor.a);
    }
  `,
}

export class KuwaharaEffect extends Effect {
  constructor({ blendFunction = BlendFunction.NORMAL, radius = 4, sectorCount = 8 } = {}) {
    super('KuwaharaEffect', KuwaharaShader.fragmentShader, {
      blendFunction,
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform<number>>([
        ['radius', new Uniform(radius)],
        ['sectorCount', new Uniform(sectorCount)],
      ]),
    })
  }

  /** Filter radius in pixels. Cost grows linearly with it. */
  get radius(): number {
    return this.uniforms.get('radius')!.value
  }

  set radius(value: number) {
    this.uniforms.get('radius')!.value = value
  }

  /** Number of sectors, 2 to 8. Fewer is cheaper but blockier. */
  get sectorCount(): number {
    return this.uniforms.get('sectorCount')!.value
  }

  set sectorCount(value: number) {
    this.uniforms.get('sectorCount')!.value = value
  }
}

export type KuwaharaProps = {
  blendFunction?: BlendFunction
  opacity?: number
  radius?: number
  sectorCount?: number
  ref?: Ref<KuwaharaEffect>
}

export const Kuwahara = /* @__PURE__ */ createEffectComponent<typeof KuwaharaEffect, KuwaharaProps>(KuwaharaEffect)
