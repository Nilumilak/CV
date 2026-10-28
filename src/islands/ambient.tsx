/**
 * Small, cosy idle animations shared by all islands. Each one mutates refs in useFrame,
 * so React never re-renders for them. Amplitudes are kept tiny on purpose: the world
 * should feel alive, not busy.
 */
import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { colors } from '@/materials/toon';

/** Gentle sway around the group origin, for trees and bushes. Put the origin at the base. */
export function Sway({
  children,
  amount = 0.02,
  speed = 0.6,
  phase = 0,
}: {
  children: ReactNode;
  /** Peak tilt in radians. */
  amount?: number;
  speed?: number;
  phase?: number;
}) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed + phase;
    ref.current.rotation.z = Math.sin(t) * amount;
    ref.current.rotation.x = Math.sin(t * 0.7 + 1.3) * amount * 0.6;
  });
  return <group ref={ref}>{children}</group>;
}

/** Slow breathing: a tiny vertical swell, for sleeping animals. Origin at the bottom. */
export function Breathe({
  children,
  amount = 0.025,
  speed = 1.4,
}: {
  children: ReactNode;
  amount?: number;
  speed?: number;
}) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const s = Math.sin(clock.elapsedTime * speed);
    ref.current.scale.set(1 + s * amount * 0.4, 1 + s * amount, 1 + s * amount * 0.4);
  });
  return <group ref={ref}>{children}</group>;
}

const PUFFS = 6;
const smokeMaterial = new THREE.MeshBasicMaterial({
  color: '#f4f1ea',
  transparent: true,
  depthWrite: false,
});

/** Soft puffs rising from a chimney, growing and fading in a loop. */
export function ChimneySmoke({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  const puffs = useRef<THREE.Mesh[]>([]);
  const materials = useMemo(() => Array.from({ length: PUFFS }, () => smokeMaterial.clone()), []);
  const geometry = useMemo(() => new THREE.SphereGeometry(0.22, 10, 8), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.35;
    for (let i = 0; i < PUFFS; i++) {
      const mesh = puffs.current[i];
      if (!mesh) continue;
      const k = (t + i / PUFFS) % 1; // 0 = just left the chimney, 1 = gone
      mesh.position.set(Math.sin(k * 4 + i) * 0.15 + k * 0.6, k * 2.2, Math.cos(k * 3 + i) * 0.1);
      mesh.scale.setScalar(0.6 + k * 1.6);
      (mesh.material as THREE.MeshBasicMaterial).opacity = Math.sin(k * Math.PI) * 0.55;
    }
  });

  return (
    <group position={position} scale={scale}>
      {materials.map((m, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) puffs.current[i] = el;
          }}
          geometry={geometry}
          material={m}
          renderOrder={2}
        />
      ))}
    </group>
  );
}

/** A warm flickering glow with a few fireflies, for lanterns and lamps. */
export function LanternGlow({
  position,
  radius = 0.12,
}: {
  position: [number, number, number];
  radius?: number;
}) {
  const light = useRef<THREE.PointLight>(null!);
  const glow = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Two slow waves plus a quick shimmer: reads as a small flame, never strobes.
    const flicker =
      0.85 + Math.sin(t * 2.1) * 0.06 + Math.sin(t * 5.3 + 1) * 0.04 + Math.sin(t * 13.7) * 0.02;
    light.current.intensity = 0.9 * flicker;
    glow.current.scale.setScalar(flicker);
  });

  return (
    <group position={position}>
      <mesh ref={glow}>
        <sphereGeometry args={[radius, 12, 10]} />
        {/* Tone-mapped, so the bulb reads as a warm glass glow rather than a white hot spot. */}
        <meshBasicMaterial color="#ffd27a" />
      </mesh>
      <pointLight ref={light} color={colors.accentGold} distance={3} decay={2} />
      <Sparkles
        count={7}
        scale={[1.6, 1.4, 1.6]}
        size={3}
        speed={0.25}
        color="#ffe39a"
        opacity={0.9}
      />
    </group>
  );
}
