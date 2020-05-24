# Effects

Here's a list of all wrapped effects with demos, example usage (with props) and reference to postprocessing docs.

##  `<Glitch />` ![![](https://img.shields.io/badge/-codesandbox-blue)]()

```jsx
import { Glitch } from 'react-postprocessing'
import { GlitchMode } from 'postrocessing'

<Glitch
  delay={[1.5, 3.5]} // min and max glitch delay
  duration={[0.6, 1.0]} // min and max glitch duration
  strength={[0.3, 1.0]} // min and max glitch strenth
  mode={GlitchMode.SPORADIC} // glitch mode
  active // turn on/off the effect
  ratio={0.85} // Threshold for strong glitches, 0 - no weak glitches, 1 - no strong glitches.
/>
```

...and more coming soon
