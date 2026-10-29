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

// --- Fountain: a four-jet water show ----------------------------------------------------

/** The show, in seconds. */
export const WATER_SHOW_SECONDS = 3.4;
const JETS = 4;
const DROPS = 16; // per jet
/** When each jet starts (one per shipped flow), when they all lean in, and when they stop. */
const JET_ON = [0.15, 0.5, 0.85, 1.2];
const CROWN = [1.55, 1.9] as const;
const JETS_OFF = 2.5;
/** How long a drop flies, and gravity. */
const DROP_LIFE = 0.75;
const GRAVITY = 9.8;

const dropGeometry = new THREE.SphereGeometry(0.035, 8, 6);
const dropMaterial = new THREE.MeshBasicMaterial({
  color: '#dff3ff',
  transparent: true,
  opacity: 0.9,
});
const rippleGeometry = new THREE.RingGeometry(0.8, 1, 32);
const rippleMaterial = new THREE.MeshBasicMaterial({
  color: '#ffffff',
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const dummy = new THREE.Object3D();
const lean = (t: number) => {
  // 0: arcing outwards into the basin; 1: leaning in to meet over the top as a crown.
  const k = Math.min(1, Math.max(0, (t - CROWN[0]) / (CROWN[1] - CROWN[0])));
  return k * k * (3 - 2 * k);
};

/**
 * The fountain comes alive: four jets of water shoot up around the basin one after another
 * (one per production flow), then lean in together into a crown over the top, glint, stop,
 * and the water settles in rings of ripples. Drops are a stream of little beads along each
 * jet's arc; nothing is drawn on the model.
 *
 * `water` is the height of the lower basin's water, `radius` how far out the jets stand in
 * it, `top` the upper bowl's water, where the last ripple spreads.
 */
export function WaterShow({
  id,
  water,
  radius,
  top,
}: {
  id: string;
  water: number;
  radius: number;
  top: number;
}) {
  const drops = useRef<THREE.InstancedMesh>(null!);
  const ripples = useRef<THREE.Mesh[]>([]);
  const progress = useReaction(id, WATER_SHOW_SECONDS);
  const rippleMaterials = useMemo(
    () => Array.from({ length: JETS + 1 }, () => rippleMaterial.clone()),
    [],
  );
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    const t = p === null ? -1 : p * WATER_SHOW_SECONDS;
    const mesh = drops.current;
    mesh.visible = p !== null;
    for (let i = 0; i < JETS; i++) {
      const a = (i / JETS) * TAU + Math.PI / 4;
      const out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      for (let j = 0; j < DROPS; j++) {
        // Drops leave the nozzle one after another; each flies DROP_LIFE seconds.
        const age = ((t / DROP_LIFE + j / DROPS) % 1) * DROP_LIFE;
        const born = t - age;
        const flying = p !== null && born > JET_ON[i]! && born < JETS_OFF;
        const crown = lean(born);
        // Outwards into the basin, or (crown) up and in to meet over the middle.
        const up = 3.3 + 1.3 * crown;
        const sideways = 0.12 - 0.92 * crown;
        dummy.position
          .copy(out)
          .multiplyScalar(radius + sideways * age)
          .setY(water + up * age - 0.5 * GRAVITY * age * age);
        // Swell out of the nozzle, shrink as they fall; gone below the water.
        const size =
          flying && dummy.position.y > water - 0.02 ? Math.min(1, age * 12) * (1 - 0.4 * age) : 0;
        dummy.scale.setScalar(size);
        dummy.updateMatrix();
        mesh.setMatrixAt(i * DROPS + j, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;

    // A ripple where each jet starts, and one wide ring as the water settles.
    ripples.current.forEach((ring, i) => {
      const start = i < JETS ? JET_ON[i]! + 0.35 : JETS_OFF + 0.4;
      const k = p === null ? -1 : (t - start) / 0.9;
      ring.visible = k > 0 && k < 1;
      if (!ring.visible) return;
      const r = i < JETS ? 0.05 + 0.12 * k : 0.08 + 0.26 * k;
      ring.scale.setScalar(r);
      rippleMaterials[i]!.opacity = 0.7 * (1 - k);
    });
  });
  return (
    <group>
      <instancedMesh
        ref={drops}
        args={[dropGeometry, dropMaterial, JETS * DROPS]}
        frustumCulled={false}
        visible={false}
        raycast={noHit}
      />
      {rippleMaterials.map((material, i) => {
        const a = (i / JETS) * TAU + Math.PI / 4;
        const landing = radius + 0.08;
        return (
          <mesh
            key={i}
            ref={(el) => {
              if (el) ripples.current[i] = el;
            }}
            geometry={rippleGeometry}
            material={material}
            position={
              i < JETS ? [Math.cos(a) * landing, water + 0.01, Math.sin(a) * landing] : [0, top, 0]
            }
            rotation-x={-Math.PI / 2}
            visible={false}
            raycast={noHit}
          />
        );
      })}
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

// --- Windmill: the shared core that powers the town --------------------------------------

/** The windmill's reaction, in seconds: the sails whirl, the blocks fly out to the town. */
export const WINDMILL_SECONDS = 3.2;
const IDLE_SAILS = 0.35; // radians per second
const WHIRL_SAILS = 7;

const sailWood = new THREE.MeshToonMaterial({
  color: '#9c6b43',
  gradientMap: palette.wood.gradientMap,
});
const sailCloth = new THREE.MeshToonMaterial({
  color: '#f6ecd6',
  side: THREE.DoubleSide,
  gradientMap: palette.wood.gradientMap,
});

/**
 * Four windmill sails on a hub, made in code (flat canvas sails would come out paper-thin
 * from image-to-3D). They turn slowly all the time; when the windmill is activated they
 * whirl up and wind down again. The axle runs along the group's Z.
 */
export function Sails({ id, length = 1.3 }: { id: string; length?: number }) {
  const rotor = useRef<THREE.Group>(null!);
  const progress = useReaction(id, WINDMILL_SECONDS);
  useFrame(({ clock }, delta) => {
    const p = progress(clock.elapsedTime);
    // Spins up fast, holds, then eases back to its idle turn.
    const whirl = p === null ? 0 : Math.sin(Math.min(1, p * 1.4) * Math.PI) ** 0.6;
    rotor.current.rotation.z -= delta * (IDLE_SAILS + (WHIRL_SAILS - IDLE_SAILS) * whirl);
  });
  return (
    <group ref={rotor}>
      <mesh material={sailWood} rotation-x={Math.PI / 2} raycast={noHit}>
        <cylinderGeometry args={[0.13, 0.13, 0.16, 14]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <group key={i} rotation-z={(i * Math.PI) / 2}>
          {/* The arm, and the canvas on one side of it, set a little back from the hub. */}
          <mesh material={sailWood} position={[0, length / 2, 0]} raycast={noHit}>
            <boxGeometry args={[0.07, length, 0.06]} />
          </mesh>
          <mesh material={sailCloth} position={[0.15, length * 0.58, -0.02]} raycast={noHit}>
            <planeGeometry args={[0.28, length * 0.78]} />
          </mesh>
          {/* A couple of cross slats over the canvas. */}
          {[0.35, 0.6, 0.85].map((at) => (
            <mesh key={at} material={sailWood} position={[0.15, length * at, 0.01]} raycast={noHit}>
              <boxGeometry args={[0.3, 0.025, 0.02]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** UI-kit pieces: a few colours, one per kind of shared part. */
const KIT_COLORS = [colors.accentGold, '#6fb3d9', colors.roofRed, '#7cc45a'];
const KIT = 9;
const kitGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);

/**
 * Small coloured blocks (pieces of the shared UI kit) fly out from the windmill's hub in
 * high arcs, a few to each of the town's buildings, and pop as they arrive: one shared
 * core, used everywhere. `targets` are where they land, relative to the windmill.
 */
export function KitDelivery({ id, from, targets }: { id: string; from: Vec3; targets: Vec3[] }) {
  const blocks = useRef<THREE.Mesh[]>([]);
  const materials = useMemo(
    () =>
      KIT_COLORS.map(
        (color) => new THREE.MeshToonMaterial({ color, gradientMap: palette.wood.gradientMap }),
      ),
    [],
  );
  const flights = useMemo(() => {
    const start = new THREE.Vector3(...from);
    return Array.from({ length: KIT }, (_, i) => ({
      start,
      end: new THREE.Vector3(...targets[i % targets.length]!).add(
        new THREE.Vector3(((i % 3) - 1) * 0.3, 0, ((i % 2) - 0.5) * 0.3),
      ),
      setOff: 0.45 + i * 0.13,
      spin: 3 + (i % 4),
    }));
  }, [from, targets]);
  const progress = useReaction(id, WINDMILL_SECONDS);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    const t = p === null ? -1 : p * WINDMILL_SECONDS;
    flights.forEach((f, i) => {
      const block = blocks.current[i];
      if (!block) return;
      const k = (t - f.setOff) / 1.1;
      block.visible = p !== null && k > 0 && k < 1.15;
      if (!block.visible) return;
      const e = Math.min(1, k);
      // A high arc, spinning as it goes; a quick pop as it arrives.
      block.position.lerpVectors(f.start, f.end, e);
      block.position.y += Math.sin(e * Math.PI) * 2.2;
      block.rotation.set(e * f.spin, e * f.spin * 0.7, 0);
      block.scale.setScalar(
        k < 0.1 ? k / 0.1 : k <= 1 ? 1 : 1 + (k - 1) * 6 * (1 - (k - 1) / 0.15),
      );
      if (k > 1) block.scale.multiplyScalar(1 - (k - 1) / 0.15);
    });
  });
  return (
    <group>
      {flights.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) blocks.current[i] = el;
          }}
          geometry={kitGeometry}
          material={materials[i % materials.length]}
          visible={false}
          raycast={noHit}
        />
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
