# Effects

Here's a list of all wrapped effects with demos, example usage (with default props) and reference to postprocessing docs.

- [`<Glitch />`](#glitch---) [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-showcase-demo-dr9rj) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/GlitchEffect.js~GlitchEffect.html)
- [`<Noise />`](#noise---) [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-showcase-demo-dr9rj)
  [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/NoiseEffect.js~NoiseEffect.html)
- [`<Bloom />`](#bloom---) [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-showcase-demo-dr9rj) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/BloomEffect.js~BloomEffect.html)
- [`<Vignette />`](#vignette---) [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-vignette-and-sepia-demo-vt0cd) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/VignetteEffect.js~VignetteEffect.html)
- [`<Sepia />`](#sepia---) [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-vignette-and-sepia-demo-vt0cd) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/SepiaEffect.js~SepiaEffect.html)
- [`<DotScreen />`](#dotscreen---) [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-dotscreen-demo-vthef) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/DotScreenEffect.js~DotScreenEffect.html)
- [`<Pixelation />`](#pixelation---) [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-pixelation-demo-q4x1h) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/PixelationEffect.js~PixelationEffect.html)
- [`<HueSaturation />`](#huesaturation---) [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-huesaturation-demo-vqis3) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/SaturationEffect.js~SaturationEffect.html)
- [`<BrightnessContrast />`](#brightnesscontrast--) [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-brightnesscontrast-demo-lhl6z) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/BrightnessContrastEffect.js~BrightnessContrastEffect.html)
- [`<ToneMapping />`](#tonemapping---) [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-tonemapping-demo-ljgcq) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/ToneMappingEffect.js~ToneMappingEffect.html)
- [`<Scanline />`](#scanline---) [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-scanline-demo-luo42) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/ScanlineEffect.js~ScanlineEffect.html)

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

## `<Vignette />` [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-vignette-and-sepia-demo-vt0cd) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/VignetteEffect.js~VignetteEffect.html)

```jsx
import { Vignette } from 'react-postprocessing'
import { BlendFunction } from 'postprocessing'

return (
  <Vignette
    offset={0.5} // vignette offset
    darkness={0.5} // vignette darkness
    eskill={false} // Eskil's vignette technique
    blendFunction={BlendFunction.NORMAL} // blend mode
  />
)
```

## `<Sepia />` [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-vignette-and-sepia-demo-vt0cd) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/SepiaEffect.js~SepiaEffect.html)

```jsx
import { Sepia } from 'react-postprocessing'

return (
  <Sepia
    intensity={1.0} // sepia intensity
    blendFunction={BlendFunction.NORMAL} // blend mode
  />
)
```

## `<DotScreen />` [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-dotscreen-demo-vthef) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/DotScreenEffect.js~DotScreenEffect.html)

```jsx
import { DotScreen } from 'react-postprocessing'
import { BlendFunction } from 'postprocessing'

return (
  <DotScreen
    blendFunction={BlendFunction.NORMAL} // blend mode
    angle={Math.PI * 0.5} // angle of the dot pattern
    scale={1.0} // scale of the dot pattern
  />
)
```

## `<Pixelation />` [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-pixelation-demo-q4x1h) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/PixelationEffect.js~PixelationEffect.html)

```jsx
import { Pixelation } from 'react-postprocessing'

return (
  <Pixelation
    granularity={5} // pixel granularity
  />
)
```

## `<HueSaturation />` [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-huesaturation-demo-vqis3) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/SaturationEffect.js~SaturationEffect.html)

```jsx
import { HueSaturation } from 'react-postprocessing'
import { BlendFunction } from 'postprocessing'

return (
  <HueSaturation
    blendFunction={BlendFunction.NORMAL} // blend mode
    hue={0} // hue in radians
    saturation={0} // saturation in radians
  />
)
```

## `<BrightnessContrast />` [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-brightnesscontrast-demo-lhl6z) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/BrightnessContrastEffect.js~BrightnessContrastEffect.html)

```jsx
import { BrightnessContrast } from 'postprocessing'

return (
  <BrightnessContrast
    brightness={0} // brightness. min: -1, max: 1
    contrast={0} // contrast: min -1, max: 1
  />
)
```

## `<ToneMapping />` [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-tonemapping-demo-ljgcq) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/ToneMappingEffect.js~ToneMappingEffect.html)

```jsx
import { ToneMapping } from 'react-postprocessing'
import { BlendFunction } from 'postprocessing'

return (
  <ToneMapping
    blendFunction={BlendFunction.NORMAL} // blend mode
    adaptive={true} // toggle adaptive luminance map usage
    resolution={256} // texture resolution of the luminance map
    middleGrey={0.6} // middle grey factor
    maxLuminance={16.0} // maximum luminance
    averageLuminance={1.0} // average luminance
    adaptationRate={1.0} // luminance adaptation rate
  />
)
```

## `<Scanline />` [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-scanline-demo-luo42) [![](https://img.shields.io/badge/-docs-green)](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/ScanlineEffect.js~ScanlineEffect.html)

```jsx
import { Scanline } from 'react-postprocessing'
import { BlendFunction } from 'postprocessing'

return (
  <Scanline
    blendFunction={BlendFunction.OVERLAY} // blend mode
    density={1.25} // scanline density
  />
)
```

...and more coming soon
