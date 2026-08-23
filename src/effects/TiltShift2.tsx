import { BlendFunction, Effect, EffectAttribute } from 'postprocessing'
import type { Ref } from 'react'
import { Uniform } from 'three'
import { createEffectComponent } from '../createEffectComponent'

const TiltShiftShader = {
  fragmentShader: /* glsl */ `

    // original shader by Evan Wallace

    #define MAX_ITERATIONS 100

    uniform float blur;
    uniform float taper;
    uniform vec2 start;
    uniform vec2 end;
    uniform vec2 direction;
    uniform int samples;

    float random(vec3 scale, float seed) {
        /* use the fragment position for a different seed per-pixel */
        return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
    }

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec4 color = vec4(0.0);
        float total = 0.0;
        vec2 startPixel = vec2(start.x * resolution.x, start.y * resolution.y);
        vec2 endPixel = vec2(end.x * resolution.x, end.y * resolution.y);
        float f_samples = float(samples);
        float half_samples = f_samples / 2.0;

        // use screen diagonal to normalize blur radii
        float maxScreenDistance = distance(vec2(0.0), resolution); // diagonal distance
        float gradientRadius = taper * (maxScreenDistance);
        float blurRadius = blur * (maxScreenDistance / 16.0);

        /* randomize the lookup values to hide the fixed number of samples */
        float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);
        vec2 normal = normalize(vec2(startPixel.y - endPixel.y, endPixel.x - startPixel.x));
        float radius = smoothstep(0.0, 1.0, abs(dot(uv * resolution - startPixel, normal)) / gradientRadius) * blurRadius;

        #pragma unroll_loop_start
        for (int i = 0; i <= MAX_ITERATIONS; i++) {
            if (i >= samples) { break; } // return early if over sample count
            float f_i = float(i);
            float s_i = -half_samples + f_i;
            float percent = (s_i + offset - 0.5) / half_samples;
            float weight = 1.0 - abs(percent);
            vec4 sample_i = texture2D(inputBuffer, uv + normalize(direction) / resolution * percent * radius);
            /* switch to pre-multiplied alpha to correctly blur transparent images */
            sample_i.rgb *= sample_i.a;
            color += sample_i * weight;
            total += weight;
        }
        #pragma unroll_loop_end

        outputColor = color / total;

        /* switch back from pre-multiplied alpha */
        outputColor.rgb /= outputColor.a + 0.00001;
    }
    `,
}

type Vec2Tuple = [number, number]

export class TiltShiftEffect extends Effect {
  constructor({
    blendFunction = BlendFunction.NORMAL,
    blur = 0.15, // [0, 1], can go beyond 1 for extra
    taper = 0.5, // [0, 1], can go beyond 1 for extra
    start = [0.5, 0.0] as Vec2Tuple, // [0,1] percentage x,y of screenspace
    end = [0.5, 1.0] as Vec2Tuple, // [0,1] percentage x,y of screenspace
    samples = 10.0, // number of blur samples
    direction = [1, 1] as Vec2Tuple, // direction of blur
  } = {}) {
    super('TiltShiftEffect', TiltShiftShader.fragmentShader, {
      blendFunction,
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform<number | Vec2Tuple>>([
        ['blur', new Uniform(blur)],
        ['taper', new Uniform(taper)],
        ['start', new Uniform(start)],
        ['end', new Uniform(end)],
        ['samples', new Uniform(samples)],
        ['direction', new Uniform(direction)],
      ]),
    })
  }

  private u<T>(name: string): T {
    return this.uniforms.get(name)!.value
  }

  private setU(name: string, value: unknown): void {
    this.uniforms.get(name)!.value = value
  }

  get blur(): number {
    return this.u('blur')
  }
  set blur(value: number) {
    this.setU('blur', value)
  }

  get taper(): number {
    return this.u('taper')
  }
  set taper(value: number) {
    this.setU('taper', value)
  }

  get start(): Vec2Tuple {
    return this.u('start')
  }
  set start(value: Vec2Tuple) {
    this.setU('start', value)
  }

  get end(): Vec2Tuple {
    return this.u('end')
  }
  set end(value: Vec2Tuple) {
    this.setU('end', value)
  }

  get samples(): number {
    return this.u('samples')
  }
  set samples(value: number) {
    this.setU('samples', value)
  }

  get direction(): Vec2Tuple {
    return this.u('direction')
  }
  set direction(value: Vec2Tuple) {
    this.setU('direction', value)
  }
}

export type TiltShift2Props = {
  blendFunction?: BlendFunction
  blur?: number
  taper?: number
  start?: Vec2Tuple
  end?: Vec2Tuple
  samples?: number
  direction?: Vec2Tuple
  ref?: Ref<TiltShiftEffect>
}

export const TiltShift2 = /* @__PURE__ */ createEffectComponent<typeof TiltShiftEffect, TiltShift2Props>(
  TiltShiftEffect
)
