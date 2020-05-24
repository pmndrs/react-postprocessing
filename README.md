# react-postprocessing

[postprocessing](https://vanruesc.github.io/postprocessing) wrapper for React and [react-three-fiber](https://github.com/react-spring/react-three-fiber) for simplied effects setup. Instead of manually initializing the composer and adding required passes you can simply put all the effects inside of `<EffectComposer />`.

## Installation

```sh
yarn add postprocessing react-postprocessing
```

## Demos

<p align="middle">
	<a href="https://codesandbox.io/s/react-postprocessing-showcase-demo-dr9rj">
		<img src="/demo.gif" />
	</a>
</p>

## Getting Started

### Effect composer

#### Passing effects

All effects are consumed by effect composer, `EffectComposer`, that creates passes and other things required for compositor to work.

You can pass effects using children:

```jsx
import React from 'react'
import { EffectComposer, Glitch } from 'react-postprocessing'
import { Canvas } from 'react-three-fiber'

const App = () => (
  <Canvas>
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="red" />
    </mesh>
    <Suspense>
      <EffectComposer>
        <Glitch />
      </EffectComposer>
    </Suspense>
  </Canvas>
)
```

#### SMAA

By default, `SMAA` is enabled in `EffectComposer`. When enabled, you can pass additional properties for configuring SMAA, such as `edgeDetection`, which sets edge detection threshold.

```jsx
<Suspense fallback={null}>
  <EffectComposer smaa edgeDetection={0.3}>
    <Glitch />
  </EffectComposer>
</Suspense>
```

### Adding effects

When you want to add a new effect your `react-three-fiber` component you first need to import the effect and then put it in children.

```jsx
import React from 'react'
import { EffectComposer, Glitch } from 'react-postprocessing'
import { Canvas } from 'react-three-fiber'

const App = () => (
  <Canvas>
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="red" />
    </mesh>
    <Suspense>
      <EffectComposer>
        <Glitch />
      </EffectComposer>
    </Suspense>
  </Canvas>
)
```

### Effects settings

Every effects inherits all the props from original `postprocessing` class, for example:

```jsx
import React from 'react'
import { EffectComposer, Glitch } from 'react-postprocessing'
import { Canvas } from 'react-three-fiber'

const App = () => (
  <Canvas>
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="red" />
    </mesh>
    <Suspense>
      <EffectComposer>
        <Glitch delay={new Vector(2, 2)} />
      </EffectComposer>
    </Suspense>
  </Canvas>
)
```

### Custom effects

Currently not all of the effects are wrapped, so if you require some effects that isn't wrapped yet you cand add them manually.

#### Using `wrapEffect`

There is an utility function in `react-postprocessing` which wraps the `postprocessing` effect in React component. You can use it to quickly make a component out of effect:

```jsx
import React from 'react'
import { EffectComposer, wrapEffect } from 'react-postprocessing'
import { NoiseEffect } from 'postprocessing'
import { Canvas } from 'react-three-fiber'

const Noise = wrapEffect(NoiseEffect)

const App = () => (
  <Canvas>
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="red" />
    </mesh>
    <Suspense>
      <EffectComposer>
        <Noise />
      </EffectComposer>
    </Suspense>
  </Canvas>
)
```

> Currently types aren't being passed properly in `wrapEffect`, it returns `RefWithExoticComponent<any>` where instead of any should be the effect class. Feel free to submit a PR to fix it!

#### From scratch

If the effect doesn't use object literals for props, `PixelationEffect` for instance, you can wrap your own component using `forwardRef` and `useImperativeHandle` and define your own props:

```jsx
import { forwardRef, useImperativeHandle, useMemo } from 'react'
import { PixelationEffect } from 'postprocessing'

const Pixelation = forwardRef(({ granularity }, ref) => {
  const effect = useMemo(() => new PixelationEffect(granularity || 5), [granularity])

  useImperativeHandle(ref, () => effect, [effect])

  return null
})

export default Pixelation
```
