# react-postprocessing

[postprocessing](https://vanruesc.github.io/postprocessing) wrapper for React and [react-three-fiber](https://github.com/react-spring/react-three-fiber).

w.i.p.

## Installation

```sh
yarn add postprocessing react-postprocessing
```

## Example

```jsx
import React from 'react'
import { Canvas } from 'react-three-fiber'
import { Vector2 } from 'three'
import { EffectComposer, Glitch, Noise } from 'react-postprocessing'

const Box = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshBasicMaterial color="red" wireframe />
  </mesh>
)

const App = () => (
  <Canvas>
    <Box />
    <EffectComposer>
      <Glitch delay={new Vector2(1, 1)} />
      <Noise />
    </EffectComposer>
  </Canvas>
)

export default App
```
