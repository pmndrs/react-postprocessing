# Effects

Here's a list of all wrapped effects with demos, example usage (with props) and reference to postprocessing docs.

* [`<Glitch />`](#glitch--) [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-glitchnoise-demo-wd4wx)
* [`<Noise />`](#noise--)  [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-glitchnoise-demo-wd4wx)


##  `<Glitch />` [![](https://img.shields.io/badge/-codesandbox-blue)](https://codesandbox.io/s/react-postprocessing-glitchnoise-demo-wd4wx)

[Docs reference](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/GlitchEffect.js~GlitchEffect.html)

```jsx
import { Glitch } from 'react-postprocessing'
import { GlitchMode } from 'postrocessing'

<Glitch
  delay={[1.5, 3.5]} // min and max glitch delay
  duration={[0.6, 1.0]} // min and max glitch duration
  strength={[0.3, 1.0]} // min and max glitch strength
  mode={GlitchMode.SPORADIC} // glitch mode
  active // turn on/off the effect
  ratio={0.85} // Threshold for strong glitches, 0 - no weak glitches, 1 - no strong glitches.
/>
```

## ]

[Docs reference](https://vanruesc.github.io/postprocessing/public/docs/class/src/effects/NoiseEffect.js~NoiseEffect.html)

```jsx
import { Noise } from 'react-postprocessing'
import { BlendFunction } from 'postprocessing'

<Noise
  premultiply // enables or disables noise premultiplication
  blendFunction={BlendFunction.ADD} // blend mode
/>
```

...and more coming soon
