import * as THREE from "three";
import React, { useEffect, useMemo, useRef } from "react";
import { Extrude, OrbitControls } from "drei";
import { useControl } from "react-three-gui";
import { useFrame } from "react-three-fiber";
import { useSpring, useSprings } from "@react-spring/core";
import { a } from "@react-spring/three";

import Lights from "./lights";

function Frame({ rot, depth = 0.3, color = "#333", ...props }) {
  const shape = useMemo(() => {
    //Create a frame shape..
    var frame = new THREE.Shape();
    frame.moveTo(-8, -3);
    frame.lineTo(8, -3);
    frame.lineTo(8, 3);
    frame.lineTo(-8, 3);

    //..with a hole:
    var hole = new THREE.Path();
    hole.moveTo(-5, -2);
    hole.lineTo(5, -2);
    hole.lineTo(5, 2);
    hole.lineTo(-5, 2);
    frame.holes.push(hole);

    return frame;
  }, []);

  const extrudeSettings = useMemo(
    () => ({
      steps: 1,
      depth,
      bevelEnabled: false,
    }),
    [depth]
  );

  return (
    <a.group {...props} rotation-z={rot}>
      <Extrude args={[shape, extrudeSettings]}>
        <meshStandardMaterial
          color="#999"
          roughness={0.7}
          castShadow
          receiveShadow
          shadowSide={THREE.FrontSide}
        />
      </Extrude>
    </a.group>
  );
}

function Floater(props) {
  const { isLaunching } = props;

  const randomDelay = useMemo(() => Math.random() * 100, []);
  const direction = useMemo(
    () => new THREE.Vector3(Math.random(), Math.random(), Math.random()),
    []
  );

  const $ref = useRef();
  useFrame(({ clock }) => {
    $ref.current.rotation.x += direction.x / 140;
    $ref.current.rotation.y += direction.y / 140;
    $ref.current.rotation.z += direction.z / 140;

    $ref.current.position.y +=
      Math.sin(randomDelay + clock.getElapsedTime() / 2) / 400;
  });

  const [spring, set] = useSpring(() => ({
    loop: true,
    position: props.position,
    config: { mass: 10, friction: 100, tension: 1600 },
  }));

  useEffect(() => {
    if (isLaunching) {
      set({ position: [1, -0.5, 1.4] });
    } else {
      set({ position: props.position });
    }
  }, [isLaunching, props.position, set]);

  return (
    <a.mesh
      {...props}
      {...spring}
      castShadow
      receiveShadow
      ref={$ref}
      onPointerDown={props.handleClick}
    >
      <boxBufferGeometry args={[0.5, 1, 0.5]} />
      <meshStandardMaterial color="#333" reflectivity={1} roughness={0.7} />
    </a.mesh>
  );
}

function Frames() {
  const [springs] = useSprings(40, (i) => ({
    loop: true,
    from: { theta: 0 },
    to: async (next) => {
      while (1) {
        await next({ theta: -Math.PI / 2 - 0.004 * (i * i) - i * 0.06 });
        await next({ theta: 0 });
      }
    },
    config: {
      mass: 100,
      tension: 400,
      friction: 400,
    },
    delay: (i) => 1000 + i * 12 + i,
  }));

  return springs.map((spring, i) => {
    const { theta } = spring;

    return (
      <Frame
        key={i}
        depth={0.5}
        scale={[0.6, 1, 1]}
        position={[0, 0, 3 - i * 0.5]}
        rot={theta}
      />
    );
  });
}

function Floaters() {
  const [launching, setLaunching] = React.useState(false);

  const group = useRef();

  useFrame(({ mouse }) => {
    group.current.position.x = THREE.MathUtils.lerp(
      group.current.position.x,
      mouse.x / 10,
      0.06
    );
    group.current.position.y = THREE.MathUtils.lerp(
      group.current.position.y,
      -mouse.y / 16,
      0.05
    );
  });

  const floaters = useMemo(() => {
    return [
      {
        scale: [0.3, 0.3, 0.3],
        position: [1.2, -1, -3],
        rotation: [2, 0.3, 0.5],
      },
      {
        scale: [0.3, 0.3, 0.3],
        position: [-1, 1, -4],
        rotation: [2, 0.3, 0.5],
      },
      {
        scale: [0.6, 0.6, 0.6],
        position: [0.8, 0, -6],
        rotation: [0.5, 0.3, 0.5],
      },
      { position: [-1.5, 0.1, -6], rotation: [-2, 3, 1] },
      { position: [0, 1, -2], rotation: [-2, 3, 1] },
      { position: [0, -1, -4], rotation: [-2, 3, 1] },
      { position: [1, 0, 0], rotation: [1, 4, 1] },
      { position: [-1.2, 0, 1], rotation: [1, 4, 1] },
    ];
  }, []);

  return (
    <group ref={group}>
      {floaters.map((floater, i) => (
        <Floater
          onClick={() => setLaunching(i)}
          isLaunching={launching === i}
          {...floater}
        />
      ))}
    </group>
  );
}

function Scene() {
  const orbitControls = useControl("Orbit Controls", { type: "boolean" });

  return (
    <>
      <Lights />

      <Frames />
      <Floaters />

      {orbitControls && <OrbitControls />}
    </>
  );
}

export default Scene;
