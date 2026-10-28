/**
 * Small, cosy idle animations shared by all islands. Each one mutates refs in useFrame,
 * so React never re-renders for them. Amplitudes are kept tiny on purpose: the world
 * should feel alive, not busy.
 */
import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { colors, gradientMap } from '@/materials/toon';
import { useReaction } from '@/objects/useReaction';

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

/** Opts an object out of pointer hit tests. */
const noHit = () => null;

/** 0 → 1 with zero speed at both ends, so motion starts and stops gently. */
const smoothstep = (x: number) => x * x * (3 - 2 * x);

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

/** A warm flickering glow for lanterns and lamps. Pair it with Fireflies for a swarm. */
export function LanternGlow({
  position,
  radius = 0.12,
  flareFor = '',
}: {
  position: [number, number, number];
  radius?: number;
  /** Interactive object id: when it's activated, the light brightens and then eases back. */
  flareFor?: string;
}) {
  const light = useRef<THREE.PointLight>(null!);
  const glow = useRef<THREE.Mesh>(null!);
  const swell = useReaction(flareFor, 2.4);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Two slow waves plus a quick shimmer: reads as a small flame, never strobes.
    const flicker =
      0.85 + Math.sin(t * 2.1) * 0.06 + Math.sin(t * 5.3 + 1) * 0.04 + Math.sin(t * 13.7) * 0.02;
    // Swell: brightens over the first third, then eases back over the rest.
    const p = swell(t);
    const f = p === null ? 0 : p < 1 / 3 ? smoothstep(p * 3) : smoothstep((1 - p) * 1.5);
    light.current.intensity = 0.9 * flicker * (1 + 2 * f);
    light.current.distance = 3 + 1.5 * f; // the warm pool on the grass grows a little too
    glow.current.scale.setScalar(flicker * (1 + 0.25 * f));
  });

  return (
    <group position={position}>
      <mesh ref={glow}>
        <sphereGeometry args={[radius, 12, 10]} />
        {/* Tone-mapped, so the bulb reads as a warm glass glow rather than a white hot spot. */}
        <meshBasicMaterial color="#ffd27a" />
      </mesh>
      <pointLight ref={light} color={colors.accentGold} distance={3} decay={2} />
    </group>
  );
}

/**
 * A small swarm of fireflies drifting slowly around one spot, e.g. a lantern.
 * Keep it outside an Interactable, so hovering the object never moves the swarm.
 */
export function Fireflies({ position }: { position: [number, number, number] }) {
  return (
    // Decoration only: never let them catch the pointer (points have a wide hit area).
    <Sparkles
      position={position}
      raycast={noHit}
      count={11}
      scale={[2.2, 1.8, 2.2]}
      size={3}
      speed={0.2}
      color="#ffe39a"
      opacity={0.9}
    />
  );
}

/** A paper letter that pops out of a mailbox slot, flips once and shrinks away. */
export function PoppingLetter({
  id,
  position,
}: {
  id: string;
  position: [number, number, number];
}) {
  const ref = useRef<THREE.Group>(null!);
  const progress = useReaction(id, 1.3);

  useFrame(({ clock }) => {
    const t = progress(clock.elapsedTime);
    const g = ref.current;
    g.visible = t !== null;
    if (t === null) return;
    g.position.set(
      position[0] + t * 0.25,
      position[1] + Math.sin(t * Math.PI * 0.6) * 0.9,
      position[2],
    );
    g.rotation.set(0.3, t * Math.PI * 2, Math.sin(t * 6) * 0.2);
    g.scale.setScalar(Math.min(1, t * 6, (1 - t) * 4));
  });

  return (
    <group ref={ref} visible={false}>
      <mesh>
        <boxGeometry args={[0.36, 0.24, 0.02]} />
        <meshToonMaterial color="#fbf3e0" gradientMap={gradientMap} />
      </mesh>
      {/* Wax seal */}
      <mesh position={[0, 0, 0.012]}>
        <circleGeometry args={[0.045, 12]} />
        <meshBasicMaterial color={colors.roofRed} />
      </mesh>
    </group>
  );
}
