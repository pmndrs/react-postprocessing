# react-postprocessing

![npm](https://img.shields.io/npm/v/react-postprocessing?label=npm%20package&style=flat-square) ![npm](https://img.shields.io/npm/dt/react-postprocessing?style=flat-square)

This is a [postprocessing](https://vanruesc.github.io/postprocessing) wrapper for React.

    npm install postprocessing react-postprocessing
    
#### What does it look like?

Well, you can do pretty much anything, but here's an example ([live demo](https://codesandbox.io/s/vigorous-currying-3r6l2)).

![](https://i.imgur.com/mZucXdX.jpg)

```jsx
import React, { useState } from 'react'
import { EffectComposer, DepthOfField, Bloom, Noise, Vignette } from 'react-postprocessing'
import { Canvas } from 'react-three-fiber'

function App() {
  return (
    <Canvas>
      {/* Your regular scene contents go here, like always ... */}
      <Suspense fallback={null}>
        <EffectComposer>
          <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
          <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} />
          <Noise opacity={0.02} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
```
    
#### Documentation

[api.md](https://github.com/react-spring/react-postprocessing/blob/master/api.md)
