/**
 * Code-made effects for the Market Town island (design: docs/plan/islands/market.md).
 * Idle effects run on their own; reactions play when their object is activated.
 */
import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { colors, palette } from '@/materials/toon';
import { useReaction } from '@/objects/useReaction';

type Vec3 = [number, number, number];
const TAU = Math.PI * 2;
const noHit = () => null;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

const COINS = 9;
const coinGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.018, 14);
const coinMaterial = new THREE.MeshBasicMaterial({ color: '#f3c25b' });

/** Gold coins jump out of the fountain in a ring and fall back in. */
export function CoinBurst({ id, position }: { id: string; position: Vec3 }) {
  const coins = useRef<THREE.Mesh[]>([]);
  const progress = useReaction(id, 1.3);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    for (let i = 0; i < COINS; i++) {
      const coin = coins.current[i];
      if (!coin) continue;
      coin.visible = p !== null;
      if (p === null) continue;
      const a = (i / COINS) * TAU;
      const r = 0.15 + p * 0.55;
      coin.position.set(
        Math.cos(a) * r,
        4 * 0.9 * p * (1 - p) + (i % 3) * 0.05 * p,
        Math.sin(a) * r,
      );
      coin.rotation.set(p * 9 + i, p * 6, 0);
    }
  });
  return (
    <group position={position}>
      {Array.from({ length: COINS }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) coins.current[i] = el;
          }}
          geometry={coinGeometry}
          material={coinMaterial}
          visible={false}
          raycast={noHit}
        />
      ))}
    </group>
  );
}

/** A few water sparkles over the fountain basin. */
export function WaterSparkles({ position }: { position: Vec3 }) {
  return (
    <Sparkles
      position={position}
      raycast={noHit}
      count={10}
      scale={[1.1, 0.5, 1.1]}
      size={2.5}
      speed={0.4}
      color="#e8f6ff"
      opacity={0.8}
    />
  );
}

const PUFFS = 7;
const puffMaterial = new THREE.MeshBasicMaterial({
  color: '#efe6d6',
  transparent: true,
  depthWrite: false,
});

/** A puff of dust clouds around an object, swelling and fading. */
export function DustPuff({ id, position }: { id: string; position: Vec3 }) {
  const puffs = useRef<THREE.Mesh[]>([]);
  const materials = useMemo(() => Array.from({ length: PUFFS }, () => puffMaterial.clone()), []);
  const geometry = useMemo(() => new THREE.SphereGeometry(0.35, 10, 8), []);
  const progress = useReaction(id, 1.2);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    for (let i = 0; i < PUFFS; i++) {
      const puff = puffs.current[i];
      if (!puff) continue;
      puff.visible = p !== null;
      if (p === null) continue;
      const a = (i / PUFFS) * TAU;
      const r = 0.6 + p * 0.6;
      puff.position.set(Math.cos(a) * r, 0.3 + (i % 3) * 0.35 + p * 0.4, Math.sin(a) * r);
      puff.scale.setScalar(0.6 + p * 1.2);
      (puff.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.75;
    }
  });
  return (
    <group position={position}>
      {materials.map((m, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) puffs.current[i] = el;
          }}
          geometry={geometry}
          material={m}
          visible={false}
          renderOrder={2}
          raycast={noHit}
        />
      ))}
    </group>
  );
}

/**
 * A tram that waits at its stop and, when activated, rides once around a circle and
 * stops where it started. Children are the tram, facing +X (its direction of travel at
 * the stop). The track is drawn as two thin rails.
 */
export function TramLoop({
  id,
  radius,
  stopAngle,
  children,
}: {
  id: string;
  radius: number;
  /** Where the stop is on the circle, in radians (0 = +X). */
  stopAngle: number;
  children: ReactNode;
}) {
  const tram = useRef<THREE.Group>(null!);
  const progress = useReaction(id, 4.5);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    const a = stopAngle + (p === null ? 0 : easeInOut(p) * TAU);
    tram.current.position.set(Math.cos(a) * radius, 0, -Math.sin(a) * radius);
    // Travel anticlockwise seen from above; face along the track.
    tram.current.rotation.y = a + Math.PI / 2;
  });
  return (
    <group>
      {[radius - 0.22, radius + 0.22].map((r) => (
        <mesh key={r} rotation-x={Math.PI / 2} position-y={0.02} raycast={noHit}>
          <torusGeometry args={[r, 0.025, 6, 64]} />
          <meshBasicMaterial color="#6b5a4a" />
        </mesh>
      ))}
      <group ref={tram}>{children}</group>
    </group>
  );
}

/** "Released": the balloon floats up slowly, hangs a moment and drifts back down. */
export function FloatUp({
  id,
  height = 3.5,
  seconds = 5,
  children,
}: {
  id: string;
  height?: number;
  seconds?: number;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null!);
  const progress = useReaction(id, seconds);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    ref.current.position.y = p === null ? 0 : Math.sin(p * Math.PI) ** 2 * height;
    ref.current.rotation.y = p === null ? 0 : Math.sin(p * Math.PI) * 0.6;
  });
  return <group ref={ref}>{children}</group>;
}

/** A round wooden launch pad for the balloon. */
export function LaunchPad({ position, radius = 0.9 }: { position: Vec3; radius?: number }) {
  return (
    <mesh position={position} material={palette.wood} raycast={noHit}>
      <cylinderGeometry args={[radius, radius * 1.05, 0.14, 24]} />
    </mesh>
  );
}

const BLOCKS = [
  { color: '#8aa0b8', size: 0.42 }, // core
  { color: colors.roofRed, size: 0.34 }, // tokens
  { color: colors.accentGold, size: 0.3 }, // icons
  { color: '#6fb3d9', size: 0.26 }, // components
];

/** Toy blocks drop one by one onto a "core" block, hold, then shrink away. */
export function BlockStack({ id, position }: { id: string; position: Vec3 }) {
  const blocks = useRef<THREE.Mesh[]>([]);
  const progress = useReaction(id, 2.6);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    let base = 0;
    for (let i = 0; i < BLOCKS.length; i++) {
      const block = blocks.current[i];
      const { size } = BLOCKS[i];
      if (!block) continue;
      block.visible = p !== null;
      if (p === null) continue;
      // Each block falls in its own slot of the first 60%, then all hold, then shrink.
      const k = Math.min(1, Math.max(0, (p - i * 0.13) / 0.15));
      const rest = base + size / 2;
      block.position.y = rest + (1 - k * k) * 1.6;
      block.visible = k > 0;
      block.scale.setScalar(p > 0.85 ? (1 - p) / 0.15 : 1);
      block.rotation.y = i * 0.35;
      base += size;
    }
  });
  return (
    <group position={position}>
      {BLOCKS.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) blocks.current[i] = el;
          }}
          visible={false}
          raycast={noHit}
        >
          <boxGeometry args={[b.size, b.size, b.size]} />
          <meshToonMaterial color={b.color} gradientMap={palette.wood.gradientMap} />
        </mesh>
      ))}
    </group>
  );
}

const FLAG_COLORS = [colors.roofRed, colors.accentGold, '#6fb3d9', '#fbf3e0'];

/**
 * A string of small triangle flags hanging between two points, sagging in the middle and
 * fluttering gently.
 */
export function Bunting({
  from,
  to,
  flags = 9,
  sag = 0.4,
}: {
  from: Vec3;
  to: Vec3;
  flags?: number;
  sag?: number;
}) {
  const group = useRef<THREE.Group>(null!);
  const { points, line } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const at = (t: number) =>
      a
        .clone()
        .lerp(b, t)
        .setY(THREE.MathUtils.lerp(a.y, b.y, t) - Math.sin(t * Math.PI) * sag);
    const points = Array.from({ length: flags }, (_, i) => at((i + 1) / (flags + 1)));
    const line = new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 21 }, (_, i) => at(i / 20)),
    );
    return { points, line };
  }, [from, to, flags, sag]);
  const flag = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.11, 0);
    shape.lineTo(0.11, 0);
    shape.lineTo(0, -0.26);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);
  const yaw = Math.atan2(to[0] - from[0], to[2] - from[2]) - Math.PI / 2;

  useFrame(({ clock }) => {
    group.current.children.forEach((c, i) => {
      c.rotation.x = Math.sin(clock.elapsedTime * 2.2 + i * 0.9) * 0.25;
    });
  });

  return (
    <group>
      <lineSegments raycast={noHit}>
        <primitive object={line} attach="geometry" />
        <lineBasicMaterial color="#8a7560" />
      </lineSegments>
      <group ref={group}>
        {points.map((p, i) => (
          <group key={i} position={p} rotation-y={yaw}>
            <mesh geometry={flag} raycast={noHit}>
              <meshBasicMaterial
                color={FLAG_COLORS[i % FLAG_COLORS.length]}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** A simple wooden pole, e.g. to hang bunting from. */
export function Pole({ position, height = 2.8 }: { position: Vec3; height?: number }) {
  return (
    <mesh
      position={[position[0], position[1] + height / 2, position[2]]}
      material={palette.wood}
      raycast={noHit}
    >
      <cylinderGeometry args={[0.05, 0.065, height, 8]} />
    </mesh>
  );
}
