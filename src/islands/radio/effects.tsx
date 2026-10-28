/**
 * Code-made effects for the Radio Tower island (design: docs/plan/islands/radio.md).
 * Idle effects run on their own; reactions play when their object is activated.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import * as THREE from 'three';
import { colors } from '@/materials/toon';
import { useReaction } from '@/objects/useReaction';
import { useWorld } from '@/store/useWorld';

type Vec3 = [number, number, number];

const smoothstep = (x: number) => x * x * (3 - 2 * x);
/** Rises over the first third, eases back over the rest. */
const swellOf = (p: number | null) =>
  p === null ? 0 : p < 1 / 3 ? smoothstep(p * 3) : smoothstep((1 - p) * 1.5);

/** The tower's beacon: a warm lamp that pulses slowly, never a harsh blink. */
export function Beacon({ position, radius = 0.2 }: { position: Vec3; radius?: number }) {
  const light = useRef<THREE.PointLight>(null!);
  const lamp = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 1.3);
    light.current.intensity = 1.2 + 1.6 * pulse;
    lamp.current.scale.setScalar(1 + 0.15 * pulse);
  });
  return (
    <group position={position}>
      <mesh ref={lamp}>
        <sphereGeometry args={[radius, 14, 12]} />
        <meshBasicMaterial color="#ffd27a" />
      </mesh>
      <pointLight ref={light} color={colors.accentGold} distance={7} decay={2} />
    </group>
  );
}

const RING_COUNT = 3;
const ringMaterial = new THREE.MeshBasicMaterial({
  color: '#fff1c4',
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
});

/** Thin rings rising from the beacon one after another, growing and fading: "always on air". */
export function SignalRings({ position, period = 4 }: { position: Vec3; period?: number }) {
  const rings = useRef<THREE.Mesh[]>([]);
  const materials = useMemo(
    () => Array.from({ length: RING_COUNT }, () => ringMaterial.clone()),
    [],
  );
  const geometry = useMemo(() => new THREE.TorusGeometry(1, 0.025, 6, 48), []);

  useFrame(({ clock }) => {
    for (let i = 0; i < RING_COUNT; i++) {
      const mesh = rings.current[i];
      if (!mesh) continue;
      const k = (clock.elapsedTime / period + i / RING_COUNT) % 1;
      mesh.scale.setScalar(0.3 + k * 2.6);
      mesh.position.y = k * 0.8;
      (mesh.material as THREE.MeshBasicMaterial).opacity = Math.sin(k * Math.PI) * 0.45;
    }
  });

  return (
    <group position={position}>
      {materials.map((m, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) rings.current[i] = el;
          }}
          geometry={geometry}
          material={m}
          rotation-x={Math.PI / 2}
          renderOrder={2}
          raycast={() => null}
        />
      ))}
    </group>
  );
}

/** On activation, a few rings ripple out from a point at once, e.g. a dish reaching 5 services. */
export function SignalBurst({
  id,
  position,
  count = 5,
}: {
  id: string;
  position: Vec3;
  count?: number;
}) {
  const rings = useRef<THREE.Mesh[]>([]);
  const progress = useReaction(id, 1.8);
  const materials = useMemo(
    () => Array.from({ length: count }, () => ringMaterial.clone()),
    [count],
  );
  const geometry = useMemo(() => new THREE.TorusGeometry(1, 0.03, 6, 48), []);

  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    for (let i = 0; i < count; i++) {
      const mesh = rings.current[i];
      if (!mesh) continue;
      // Each ring starts a little after the one before.
      const k = p === null ? -1 : (p - i * 0.12) / 0.5;
      mesh.visible = k > 0 && k < 1;
      if (!mesh.visible) continue;
      mesh.scale.setScalar(0.2 + k * 1.6);
      (mesh.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.7;
    }
  });

  return (
    <group position={position}>
      {materials.map((m, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) rings.current[i] = el;
          }}
          geometry={geometry}
          material={m}
          visible={false}
          renderOrder={2}
          raycast={() => null}
        />
      ))}
    </group>
  );
}

/**
 * Warm light in a doorway: always a soft glow, and on activation it swells as if the lab
 * inside just switched on, then fades back.
 */
export function DoorGlow({
  id,
  position,
  width = 0.7,
  height = 1.1,
}: {
  id: string;
  position: Vec3;
  width?: number;
  height?: number;
}) {
  const light = useRef<THREE.PointLight>(null!);
  const pane = useRef<THREE.Mesh>(null!);
  const progress = useReaction(id, 2.4);
  useFrame(({ clock }) => {
    const f = swellOf(progress(clock.elapsedTime));
    light.current.intensity = 0.5 + 2.5 * f;
    (pane.current.material as THREE.MeshBasicMaterial).opacity = 0.12 + 0.55 * f;
  });
  return (
    <group position={position}>
      <mesh ref={pane} position={[0, 0, 0.02]} raycast={() => null}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#ffcf7a" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <pointLight
        ref={light}
        position={[0, 0, 0.5]}
        color={colors.accentGold}
        distance={4}
        decay={2}
      />
    </group>
  );
}

/** Slow, gentle hovering, for the robot. */
export function Hover({
  children,
  height = 0.08,
  speed = 1.3,
}: {
  children: ReactNode;
  height?: number;
  speed?: number;
}) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    ref.current.position.y = Math.sin(clock.elapsedTime * speed) * height;
  });
  return <group ref={ref}>{children}</group>;
}

/** A very slow constant turn, for the dish scanning the sky. */
export function SlowTurn({ children, speed = 0.12 }: { children: ReactNode; speed?: number }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    ref.current.rotation.y += delta * speed;
  });
  return <group ref={ref}>{children}</group>;
}

/** A sheet of generated test code that pops out of the robot, floats up and shrinks away. */
export function PoppingScroll({ id, position }: { id: string; position: Vec3 }) {
  const ref = useRef<THREE.Group>(null!);
  const progress = useReaction(id, 1.6);
  const texture = useMemo(() => codeSheetTexture(), []);
  useFrame(({ clock }) => {
    const t = progress(clock.elapsedTime);
    const g = ref.current;
    g.visible = t !== null;
    if (t === null) return;
    g.position.set(
      position[0],
      position[1] + Math.sin(t * Math.PI * 0.6) * 0.8,
      position[2] + 0.15,
    );
    g.rotation.set(0, Math.sin(t * 3) * 0.3, Math.sin(t * 5) * 0.08);
    // Unrolls on the way up, shrinks away at the end.
    g.scale.set(Math.min(1, t * 5, (1 - t) * 4), Math.min(1, t * 3, (1 - t) * 4), 1);
  });
  return (
    <group ref={ref} visible={false}>
      <mesh raycast={() => null}>
        <planeGeometry args={[0.32, 0.46]} />
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** A green check mark that pops up above an object and fades: "tests pass". */
export function CheckMarkPop({ id, position }: { id: string; position: Vec3 }) {
  const ref = useRef<THREE.Group>(null!);
  const progress = useReaction(id, 1.4);
  useFrame(({ clock }) => {
    const t = progress(clock.elapsedTime);
    const g = ref.current;
    g.visible = t !== null;
    if (t === null) return;
    g.position.set(position[0], position[1] + t * 0.6, position[2]);
    // Overshoot pop in, hold, shrink out.
    const pop = t < 0.2 ? Math.sin((t / 0.2) * Math.PI * 0.75) * 1.25 : t > 0.8 ? (1 - t) / 0.2 : 1;
    g.scale.setScalar(Math.max(pop, 0.001));
  });
  return (
    <group ref={ref} visible={false}>
      <mesh position={[-0.12, -0.05, 0]} rotation-z={Math.PI / 4} raycast={() => null}>
        <boxGeometry args={[0.1, 0.3, 0.08]} />
        <meshBasicMaterial color="#5fbf5a" />
      </mesh>
      <mesh position={[0.1, 0.08, 0]} rotation-z={-Math.PI / 5} raycast={() => null}>
        <boxGeometry args={[0.1, 0.56, 0.08]} />
        <meshBasicMaterial color="#5fbf5a" />
      </mesh>
    </group>
  );
}

/**
 * A simplified drawing of the test platform UI on the big screen, in light or dark theme.
 * Each activation switches the theme with a soft cross-fade.
 */
export function ScreenPicture({
  id,
  position,
  width,
  height,
}: {
  id: string;
  position: Vec3;
  width: number;
  height: number;
}) {
  const [dark, setDark] = useState(false);
  const darkPane = useRef<THREE.Mesh>(null!);
  const fade = useRef(0);
  const textures = useMemo(() => ({ light: uiTexture(false), dark: uiTexture(true) }), []);

  useEffect(
    () =>
      useWorld.subscribe((s, prev) => {
        if (s.activeCount !== prev.activeCount && s.activeObject === id) setDark((d) => !d);
      }),
    [id],
  );

  useFrame((_, delta) => {
    easing.damp(fade, 'current', dark ? 1 : 0, 0.25, delta);
    (darkPane.current.material as THREE.MeshBasicMaterial).opacity = fade.current;
  });

  return (
    <group position={position}>
      <mesh raycast={() => null}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={textures.light} toneMapped={false} />
      </mesh>
      <mesh ref={darkPane} position={[0, 0, 0.002]} raycast={() => null}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={textures.dark} transparent opacity={0} toneMapped={false} />
      </mesh>
    </group>
  );
}

// --- Canvas drawings -------------------------------------------------------------

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function roundRect(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}

/** Sidebar, top bar, a table of test runs with status dots, and two cards. No real data. */
function uiTexture(dark: boolean) {
  const c = dark
    ? {
        bg: '#1f2633',
        panel: '#2a3344',
        line: '#3a4559',
        text: '#8f9bb3',
        accent: colors.accentGold,
      }
    : { bg: '#f6f2ea', panel: '#e6dfd2', line: '#d6cdbc', text: '#9a8f7d', accent: '#d9a43a' };
  return canvasTexture(640, 400, (g) => {
    g.fillStyle = c.bg;
    g.fillRect(0, 0, 640, 400);
    // Sidebar with menu items, the active one highlighted.
    g.fillStyle = c.panel;
    g.fillRect(0, 0, 130, 400);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = i === 1 ? c.accent : c.line;
      roundRect(g, 18, 70 + i * 42, i === 1 ? 94 : 70 + (i % 3) * 8, 14, 7);
    }
    g.fillStyle = c.accent;
    roundRect(g, 18, 24, 40, 24, 8);
    // Top bar.
    g.fillStyle = c.panel;
    g.fillRect(130, 0, 510, 56);
    g.fillStyle = c.line;
    roundRect(g, 152, 21, 160, 14, 7);
    roundRect(g, 560, 16, 60, 24, 12);
    // Two summary cards.
    for (let i = 0; i < 2; i++) {
      g.fillStyle = c.panel;
      roundRect(g, 152 + i * 240, 76, 220, 86, 12);
      g.fillStyle = c.accent;
      roundRect(g, 170 + i * 240, 96, 60, 12, 6);
      g.fillStyle = c.line;
      roundRect(g, 170 + i * 240, 124, 140, 14, 7);
    }
    // Test runs table: status dot, name, duration.
    const status = ['#5fbf5a', '#5fbf5a', '#e2b84a', '#5fbf5a', '#d86a5a'];
    for (let r = 0; r < 5; r++) {
      const y = 186 + r * 40;
      g.fillStyle = c.panel;
      roundRect(g, 152, y, 460, 32, 8);
      g.fillStyle = status[r];
      g.beginPath();
      g.arc(172, y + 16, 7, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = c.text;
      roundRect(g, 190, y + 10, 150 + ((r * 37) % 90), 12, 6);
      roundRect(g, 540, y + 10, 52, 12, 6);
    }
  });
}

/** A paper sheet with colourful lines of "code". */
function codeSheetTexture() {
  return canvasTexture(256, 368, (g) => {
    g.fillStyle = '#fbf3e0';
    g.fillRect(0, 0, 256, 368);
    const palette = ['#c9573e', '#4e8b3a', '#2e6fcf', '#9c6b43', '#7a6f62'];
    for (let i = 0; i < 14; i++) {
      const indent = [0, 1, 1, 2, 2, 1, 0, 1, 2, 2, 1, 1, 0, 0][i] * 18;
      g.fillStyle = palette[(i * 3) % palette.length];
      roundRect(g, 22 + indent, 26 + i * 23, 50 + ((i * 53) % 120), 10, 5);
    }
  });
}
