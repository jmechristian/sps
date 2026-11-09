"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges, Float } from "@react-three/drei";
import type { Group, MeshStandardMaterial, PointLight } from "three";
import { Color } from "three";

const navy = new Color("#15345e");
const ember = new Color("#e54926");
const gold = new Color("#f4aa00");

function Rig() {
  const group = useRef<Group>(null);
  const deck = useRef<MeshStandardMaterial>(null);
  const warm = useRef<PointLight>(null);
  const cool = useRef<PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const wave = (Math.sin(t * 0.35) + 1) / 2;
    if (group.current) {
      const targetY = 0.55 + state.pointer.x * 0.28;
      const targetX = 0.22 - state.pointer.y * 0.12;
      group.current.rotation.y += (targetY - group.current.rotation.y) * 0.05;
      group.current.rotation.x += (targetX - group.current.rotation.x) * 0.05;
      group.current.position.x = state.size.width >= 1024 ? state.viewport.width * 0.18 : 0;
      group.current.position.y = Math.sin(t * 0.7) * 0.06;
    }
    if (deck.current) {
      deck.current.emissive.copy(navy).lerp(ember, 0.15 + wave * 0.55);
      deck.current.emissiveIntensity = 0.25 + wave * 0.55;
    }
    if (warm.current) {
      warm.current.position.x = Math.sin(t * 0.4) * 2.2;
      warm.current.color.copy(ember).lerp(gold, wave);
    }
    if (cool.current) {
      cool.current.position.z = Math.cos(t * 0.33) * 2;
    }
  });

  return (
    <group ref={group} rotation={[0.22, 0.55, 0]}>
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[2.7, 0.16, 2.7]} />
        <meshStandardMaterial
          ref={deck}
          color="#0d3f6e"
          emissive="#15345e"
          roughness={0.38}
          metalness={0.22}
        />
        <Edges color="#f4aa00" threshold={12} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 0]}>
        <planeGeometry args={[2.35, 2.35, 10, 10]} />
        <meshBasicMaterial color="#8eb4e0" wireframe transparent opacity={0.45} />
      </mesh>
      <Float speed={1.6} floatIntensity={0.35} rotationIntensity={0.08}>
        <mesh position={[-0.55, 0.52, 0.2]}>
          <boxGeometry args={[0.72, 0.72, 0.72]} />
          <meshStandardMaterial color="#e54926" emissive="#e54926" emissiveIntensity={0.18} roughness={0.42} />
          <Edges color="#f7f4ef" />
        </mesh>
      </Float>
      <Float speed={1.2} floatIntensity={0.45} rotationIntensity={0.12}>
        <mesh position={[0.48, 0.62, -0.22]}>
          <boxGeometry args={[0.58, 0.96, 0.58]} />
          <meshStandardMaterial color="#f4aa00" emissive="#f4aa00" emissiveIntensity={0.12} roughness={0.5} />
          <Edges color="#071e36" />
        </mesh>
      </Float>
      <Float speed={1.8} floatIntensity={0.3} rotationIntensity={0.1}>
        <mesh position={[0.18, 0.36, 0.62]}>
          <boxGeometry args={[0.46, 0.4, 0.46]} />
          <meshStandardMaterial color="#f7f4ef" roughness={0.55} metalness={0.05} />
          <Edges color="#15345e" />
        </mesh>
      </Float>
      <mesh position={[0, 1.35, 0]} rotation={[0.5, 0.2, 0.1]}>
        <boxGeometry args={[1.55, 0.015, 1.15]} />
        <meshStandardMaterial color="#d7e6f5" emissive="#6a8cff" emissiveIntensity={0.35} transparent opacity={0.72} />
        <Edges color="#f7f4ef" />
      </mesh>
      <mesh position={[0, 1.15, 0]} rotation={[Math.PI / 2.2, 0, 0.4]}>
        <torusGeometry args={[0.78, 0.012, 12, 80]} />
        <meshBasicMaterial color="#e54926" />
      </mesh>
      <pointLight ref={warm} position={[1.6, 1.8, 1]} intensity={18} color="#e54926" distance={8} />
      <pointLight ref={cool} position={[-1.4, 1.2, -1]} intensity={12} color="#f4aa00" distance={7} />
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [3.5, 2.15, 3.7], fov: 34 }}
      dpr={[1, 1.6]}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 3]} intensity={1.5} color="#f7f4ef" />
      <Rig />
    </Canvas>
  );
}
