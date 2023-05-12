import * as React from 'react'
import { Vector3 } from 'three'
import { Canvas, Props as CanvasProps } from '@react-three/fiber'

import { CameraControls } from '@react-three/drei'

type Props = React.PropsWithChildren<
  CanvasProps & {
    cameraFov?: number
    cameraPosition?: Vector3
    controls?: boolean
    lights?: boolean
  }
>

export const Setup = ({
  children,
  cameraFov = 75,
  cameraPosition = new Vector3(-5, 5, 5),
  controls = true,
  lights = true,
  ...restProps
}: Props) => (
  <div style={{ height: '100%' }}>
    <Canvas shadows camera={{ position: cameraPosition, fov: cameraFov }} {...restProps}>
      {children}
      {lights && (
        <>
          <ambientLight intensity={0.8} />
          <pointLight intensity={1} position={[0, 6, 0]} />
        </>
      )}
      {controls && <CameraControls makeDefault />}
    </Canvas>
  </div>
)
