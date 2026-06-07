"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Instances, Instance } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const GRID = 30;
const SPACING = 2.4;
const NEON = ["#19D184", "#FF1DCE", "#BFFF00"];
const DARK = "#0a1018";

type B = { pos: [number, number, number]; scale: [number, number, number]; color: THREE.Color };

function useBuildings(): B[] {
  return useMemo(() => {
    const arr: B[] = [];
    for (let x = 0; x < GRID; x++) {
      for (let z = 0; z < GRID; z++) {
        const cx = (x - GRID / 2) * SPACING + (Math.random() - 0.5) * 0.6;
        const cz = (z - GRID / 2) * SPACING + (Math.random() - 0.5) * 0.6;
        const h = 0.6 + Math.pow(Math.random(), 2.4) * 9;
        const w = 0.9 + Math.random() * 0.6;
        const lit = Math.random() < 0.14;
        const color = new THREE.Color(lit ? NEON[Math.floor(Math.random() * NEON.length)] : DARK);
        if (lit) color.multiplyScalar(2.4); // push past 1.0 so Bloom makes it glow
        arr.push({ pos: [cx, h / 2, cz], scale: [w, h, w], color });
      }
    }
    return arr;
  }, []);
}

function City() {
  const buildings = useBuildings();
  return (
    <Instances limit={buildings.length} range={buildings.length}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
      {buildings.map((b, i) => (
        <Instance key={i} position={b.pos} scale={b.scale} color={b.color} />
      ))}
    </Instances>
  );
}

function Rig() {
  const t = useRef(Math.PI * 0.25);
  useFrame((state, delta) => {
    t.current += Math.min(delta, 0.05) * 0.04; // slow, clamp delta to avoid jumps
    const r = 34 + Math.sin(t.current * 0.5) * 5;
    const y = 17 + Math.sin(t.current * 0.7) * 3.5;
    state.camera.position.set(Math.cos(t.current) * r, y, Math.sin(t.current) * r);
    state.camera.lookAt(0, 2.5, 0);
  });
  return null;
}

export function CityBackground() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 60, near: 0.1, far: 220, position: [34, 17, 0] }}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color("#04070d");
        scene.fog = new THREE.Fog("#04070d", 26, 82);
      }}
    >
      <City />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[600, 600]} />
        <meshBasicMaterial color="#02040a" toneMapped={false} />
      </mesh>
      <Rig />
      <EffectComposer>
        <Bloom mipmapBlur intensity={1.6} luminanceThreshold={0.25} luminanceSmoothing={0.2} radius={0.75} />
      </EffectComposer>
    </Canvas>
  );
}
