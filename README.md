# react-postprocessing

![npm](https://img.shields.io/npm/v/react-postprocessing?label=npm%20package&style=flat-square) ![npm](https://img.shields.io/npm/dt/react-postprocessing?style=flat-square)

This is a [postprocessing](https://vanruesc.github.io/postprocessing) wrapper for [react-three-fiber](https://github.com/react-spring/react-three-fiber). This is not (yet) meant for complex orchestration of effects, but can save you [hundreds of LOC](https://twitter.com/0xca0a/status/1289501594698960897) for a straight forward effects-chain. The composer configures webGL2 MSAA (multi sample anti aliasing) by default so you get high performance crisp results w/o jagged edges.

```bash
npm install postprocessing react-postprocessing
```

#### What does it look like?

Well, you can do pretty much anything, but here's an example combining a couple of effects ([live demo](https://codesandbox.io/s/vigorous-currying-3r6l2)).

<a href="https://codesandbox.io/s/vigorous-currying-3r6l2" target="_blank" rel="noopener">
<img src="https://i.imgur.com/mZucXdX.jpg" alt="Bubbles Demo" />
</a>

```jsx
import React from 'react'
import { EffectComposer, DepthOfField, Bloom, Noise, Vignette } from 'react-postprocessing'
import { Canvas } from 'react-three-fiber'

function App() {
  return (
    <Canvas>
      {/* Your regular scene contents go here, like always ... */}
      <EffectComposer>
        <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
        <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} />
        <Noise opacity={0.02} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  )
}
```
    
#### Documentation

[api.md](https://github.com/react-spring/react-postprocessing/blob/master/api.md)
