# Effects

Here's a list of all wrapped effects with demos, example usage (with default props) and reference to postprocessing docs.

- [`<Glitch />`](#glitch--) [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-glitchnoise-demo-wd4wx) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/GlitchEffect.js~GlitchEffect.html)
- [`<Noise />`](#noise--) [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-glitchnoise-demo-wd4wx)
  [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/NoiseEffect.js~NoiseEffect.html)
- [`<Bloom />`](#bloom--) [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-ssao-smaa-and-bloom-demo-r9ujf) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/BloomEffect.js~BloomEffect.html)

## `<Glitch />` [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-glitchnoise-demo-wd4wx) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/GlitchEffect.js~GlitchEffect.html)

```jsx
import { Glitch } from 'react-postprocessing'
import { GlitchMode } from 'postrocessing'

return (
  <Glitch
    delay={[1.5, 3.5]} // min and max glitch delay
    duration={[0.6, 1.0]} // min and max glitch duration
    strength={[0.3, 1.0]} // min and max glitch strength
    mode={GlitchMode.SPORADIC} // glitch mode
    active // turn on/off the effect (switches between "mode" prop and GlitchMode.DISABLED)
    ratio={0.85} // Threshold for strong glitches, 0 - no weak glitches, 1 - no strong glitches.
  />
)
```

## `<Noise />` [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-glitchnoise-demo-wd4wx) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/NoiseEffect.js~NoiseEffect.html)

```jsx
import { Noise } from 'react-postprocessing'
import { BlendFunction } from 'postprocessing'

return (
  <Noise
    premultiply // enables or disables noise premultiplication
    blendFunction={BlendFunction.ADD} // blend mode
  />
)
```

## `<Bloom />` [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-ssao-smaa-and-bloom-demo-r9ujf) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/BloomEffect.js~BloomEffect.html)

```jsx
import { Bloom } from 'react-postprocessing'
import { BlurPass, Resizer, KernelSize } from 'postprocessing'

return (
  <Bloom
    intensity={1.0} // The bloom intensity.
    blurPass={undefined} // A blur pass.
    width={Resizer.AUTO_SIZE} // render width
    height={Resizer.AUTO_SIZE} // render height
    kernelSize={KernelSize.LARGE} // blur kernel size
    luminanceThreshold={0.9} // luminance threshold. Raise this value to mask out darker elements in the scene.
    luminanceSmoothing={0.025} // smoothness of the luminance threshold. Range is [0, 1]
  />
)
```

...and more coming soon
