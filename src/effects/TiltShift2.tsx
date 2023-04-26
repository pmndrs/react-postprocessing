import { Uniform } from 'three'
import { BlendFunction, Effect, EffectAttribute } from 'postprocessing'
import { wrapEffect } from '../util'

const TiltShiftShader = {
  fragmentShader: `
    // original shader by Evan Wallace
    uniform float blur;
    uniform float gradient;
    uniform vec2 start;
    uniform vec2 end;
    uniform vec2 delta;

    float random(vec3 scale, float seed) {
      /* use the fragment position for a different seed per-pixel */
      return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
    }

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {

        vec4 color = vec4(0.0);
        float total = 0.0;
        vec2 startPixel = vec2(start.x * resolution.x, start.y * resolution.y);
        vec2 endPixel = vec2(end.x * resolution.x, end.y * resolution.y);

        /* randomize the lookup values to hide the fixed number of samples */
        float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);
        vec2 normal = normalize(vec2(startPixel.y - endPixel.y, endPixel.x - startPixel.x));
        float radius = smoothstep(0.0, 1.0, abs(dot(uv * resolution - startPixel, normal)) / gradient) * blur;

        #pragma unroll_loop_start
        for (float i = -3.0; i <= 3.0; i++) {
            float percent = (i + offset - 0.5) / 3.0;
            float weight = 1.0 - abs(percent);
            vec4 sample_t = texture2D(inputBuffer, uv + delta / resolution * percent * radius);
            /* switch to pre-multiplied alpha to correctly blur transparent images */
            sample_t.rgb *= sample_t.a;
            color += sample_t * weight;
            total += weight;
        }
        #pragma unroll_loop_end

        outputColor = color / total;
        /* switch back from pre-multiplied alpha */
        outputColor.rgb /= outputColor.a + 0.00001;
    }
    `,
}

export class TiltShiftEffect extends Effect {
  constructor({
    blendFunction = BlendFunction.ADD,
    blur = 20.0,
    gradient = 1100.0,
    start = [0.5, 0.0],
    end = [0.5, 1.0],
    delta = [1, 1],
  } = {}) {
    super('TiltShiftEffect', TiltShiftShader.fragmentShader, {
      blendFunction,
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map([
        ['blur', new Uniform(blur)],
        ['gradient', new Uniform(gradient)],
        ['start', new Uniform(start)],
        ['end', new Uniform(end)],
        ['delta', new Uniform(delta)],
      ]),
    })
  }
}

export const TiltShift2 = wrapEffect(TiltShiftEffect, { blendFunction: BlendFunction.NORMAL })
