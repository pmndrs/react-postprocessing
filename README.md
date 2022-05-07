# react-postprocessing

[![Version](https://img.shields.io/npm/v/@react-three/postprocessing?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@react-three/postprocessing)
[![Downloads](https://img.shields.io/npm/dt/@react-three/postprocessing.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@react-three/postprocessing)
[![Discord Shield](https://img.shields.io/discord/740090768164651008?style=flat&colorA=000000&colorB=000000&label=discord&logo=discord&logoColor=ffffff)](https://discord.gg/ZZjjNvJ)

`react-postprocessing` is a [postprocessing](https://github.com/vanruesc/postprocessing) wrapper for [@react-three/fiber](https://github.com/pmndrs/@react-three/fiber). This is not (yet) meant for complex orchestration of effects, but can save you [hundreds of LOC](https://twitter.com/0xca0a/status/1289501594698960897) for a straight forward effects-chain.

```bash
npm install @react-three/postprocessing
```

<p align="center">
  <a href="https://pqrpl.csb.app" target="_blank"><img width="274" src="bubbles.jpg" alt="Bubbles" /></a>
  <a href="https://5jgjz.csb.app" target="_blank"><img width="274" src="control.jpg" alt="Take Control" /></a>
</p>
<p align="middle">
  <i>These demos are real, you can click them! They contain the full code, too. 📦</i>
</p>

#### Why postprocessing and not three/examples/jsm/postprocessing?

From [https://github.com/vanruesc/postprocessing](https://github.com/vanruesc/postprocessing#performance)

> This library provides an EffectPass which automatically organizes and merges any given combination of effects. This minimizes the amount of render operations and makes it possible to combine many effects without the performance penalties of traditional pass chaining. Additionally, every effect can choose its own blend function.
>
> All fullscreen render operations also use a single triangle that fills the screen. Compared to using a quad, this approach harmonizes with modern GPU rasterization patterns and eliminates unnecessary fragment calculations along the screen diagonal. This is especially beneficial for GPGPU passes and effects that use complex fragment shaders.

Postprocessing also supports srgb-encoding out of the box, as well as WebGL2 MSAA (multi sample anti aliasing), which is react-postprocessing's default, you get high performance crisp results w/o jagged edges.

#### What does it look like?

Here's an example combining a couple of effects ([live demo](https://codesandbox.io/s/react-postprocessing-dof-blob-pqrpl?)).

<a href="https://codesandbox.io/s/react-postprocessing-dof-blob-pqrpl?" target="_blank" rel="noopener">
<img src="bubbles.jpg" alt="Bubbles Demo" />
</a>

```jsx
import React from 'react'
import { EffectComposer, DepthOfField, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import { Canvas } from '@react-three/fiber'

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

## Documentation

#### EffectComposer

The EffectComposer must wrap all your effects. It will manage them for you.

```jsx
<EffectComposer
  enabled?: boolean
  children: JSX.Element | JSX.Element[]
  depthBuffer?: boolean
  disableNormalPass?: boolean
  stencilBuffer?: boolean
  autoClear?: boolean
  multisampling?: number
  frameBufferType?: TextureDataType
  /** For effects that support DepthDownsamplingPass */
  resolutionScale?: number
  renderPriority?: number
  camera?: THREE.Camera
  scene?: THREE.Scene
>
```

#### Selection/Select

Some effects, like Outline or SelectiveBloom can select specific objects. To manage this in a declarative scene with just references can be messy, especially when things have to be grouped. These two components take care of it:

```jsx
<Selection
  children: JSX.Element | JSX.Element[]
  enabled?: boolean
>

<Select
  children: JSX.Element | JSX.Element[]
  enabled?: boolean
>
```

You wrap everything into a selection, this one holds all the selections. Now you can individually select objects or groups. Effects that support selections (for instance `Outline`) will acknowledge it.

```jsx
<Selection>
  <EffectComposer autoclear={false}>
    <Outline blur edgeStrength={100} />
  </EffectComposer>
  <Select enabled>
    <mesh />
  </Select>
</Selection>
```

Selection can be nested and group multiple object, higher up selection take precence over lower ones. The following for instance will select everything. Remove the outmost `enabled` and only the two mesh group is selected. You can flip the selections or bind them to interactions and state.

```jsx
<Select enabled>
  <Select enabled>
    <mesh />
    <mesh />
  </Select>
  <Select>
    <mesh />
  </Select>
</Select>
```

- [react-postprocessing exports](https://github.com/pmndrs/react-postprocessing/blob/master/api.md)
- [postprocessing docs](https://pmndrs.github.io/postprocessing/public/docs/)
