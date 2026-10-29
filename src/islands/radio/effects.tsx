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
 * Warm light in front of a doorway: always a soft glow, and on activation it swells as
 * if the lab inside just switched on, then fades back. Light only, no shape, so it takes
 * the form of whatever door it shines on.
 */
export function DoorGlow({ id, position }: { id: string; position: Vec3 }) {
  const light = useRef<THREE.PointLight>(null!);
  const progress = useReaction(id, 2.4);
  useFrame(({ clock }) => {
    const f = swellOf(progress(clock.elapsedTime));
    light.current.intensity = 0.5 + 4 * f;
  });
  return (
    <pointLight
      ref={light}
      position={[position[0], position[1], position[2] + 0.5]}
      color={colors.accentGold}
      distance={4}
      decay={2}
    />
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

// --- Robot: thinks, then delivers tests -------------------------------------------------

/**
 * The robot's reaction, in seconds: it thinks (a chat bubble with typing dots, a glowing
 * eye, a rocking head) until THINK, then hops and sends test cards fluttering out.
 */
export const THINK = 1.4;
export const ROBOT_SECONDS = 3.2;

/** Seconds into the robot's reaction, or null when it is not playing. */
const robotTime = (p: number | null) => (p === null ? null : p * ROBOT_SECONDS);

/** Rocks side to side while thinking, then a happy hop as the tests come out. */
export function ThinkAndHop({ id, children }: { id: string; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  const progress = useReaction(id, ROBOT_SECONDS);
  useFrame(({ clock }) => {
    const t = robotTime(progress(clock.elapsedTime));
    const g = ref.current;
    const thinking = t !== null && t < THINK;
    g.rotation.z = thinking ? Math.sin(t * 9) * 0.08 * Math.min(1, t * 4) : 0;
    const hop = t === null ? -1 : (t - THINK) / 0.6;
    g.position.y = hop > 0 && hop < 1 ? Math.sin(hop * Math.PI) * 0.3 : 0;
  });
  return <group ref={ref}>{children}</group>;
}

/** A soft glow from the robot's eye: pulsing while it thinks, a flash as it delivers. */
export function EyeGlow({ id, position }: { id: string; position: Vec3 }) {
  const light = useRef<THREE.PointLight>(null!);
  const progress = useReaction(id, ROBOT_SECONDS);
  useFrame(({ clock }) => {
    const t = robotTime(progress(clock.elapsedTime));
    light.current.intensity =
      t === null
        ? 0
        : t < THINK
          ? 0.8 + 0.6 * Math.sin(t * 10)
          : 3 * Math.max(0, 1 - (t - THINK) / 0.5);
  });
  return (
    <pointLight ref={light} position={position} color="#9fe3ff" intensity={0} distance={1.4} />
  );
}

/** A white chat bubble with three dots; `raised` lifts one of them (−1: none). */
function bubbleTexture(raised: number) {
  return canvasTexture(256, 180, (g) => {
    g.fillStyle = '#fffdf6';
    g.strokeStyle = 'rgba(43, 36, 34, 0.35)';
    g.lineWidth = 6;
    g.beginPath();
    g.roundRect(10, 10, 236, 130, 60);
    g.moveTo(70, 136);
    g.lineTo(52, 172);
    g.lineTo(104, 138);
    g.fill();
    g.stroke();
    g.fillStyle = '#fffdf6';
    g.fillRect(64, 128, 44, 12);
    g.fillStyle = '#5a5250';
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.arc(78 + i * 50, i === raised ? 62 : 76, 15, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/**
 * A chat bubble over the robot with "typing" dots while it thinks; it pops at THINK.
 * Swaps between a few drawings to make the dots bounce.
 */
export function ThinkingBubble({ id, position }: { id: string; position: Vec3 }) {
  const sprite = useRef<THREE.Sprite>(null!);
  const frames = useMemo(() => [0, 1, 2, -1].map((raised) => bubbleTexture(raised)), []);
  const progress = useReaction(id, ROBOT_SECONDS);
  useFrame(({ clock }) => {
    const t = robotTime(progress(clock.elapsedTime));
    const s = sprite.current;
    s.visible = t !== null && t < THINK + 0.2;
    if (!s.visible || t === null) return;
    const material = s.material as THREE.SpriteMaterial;
    const frame = frames[Math.floor(t * 6) % frames.length]!;
    if (material.map !== frame) {
      material.map = frame;
      material.needsUpdate = true;
    }
    // Pops in, holds, then a quick swell and gone as the answer comes out.
    const size =
      t < 0.18
        ? Math.sin((t / 0.18) * Math.PI * 0.75) * 1.15
        : t < THINK
          ? 1
          : 1.2 * (1 - (t - THINK) / 0.2);
    s.scale.set(0.5 * size, 0.35 * size, 1);
  });
  return (
    <sprite ref={sprite} position={position} visible={false} raycast={() => null}>
      <spriteMaterial map={frames[0]} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

const CARDS = 4;

/**
 * Little cards of generated test code shoot out of the robot after it has thought, arc out
 * to the sides and flutter down to the grass, fading as they land.
 */
export function TestCards({ id, position }: { id: string; position: Vec3 }) {
  const cards = useRef<THREE.Group[]>([]);
  const texture = useMemo(() => codeSheetTexture(), []);
  const progress = useReaction(id, ROBOT_SECONDS);
  useFrame(({ clock }) => {
    const t = robotTime(progress(clock.elapsedTime));
    cards.current.forEach((card, i) => {
      const k = t === null ? -1 : (t - THINK - 0.1 - i * 0.12) / 1.5;
      card.visible = k > 0 && k < 1;
      if (!card.visible) return;
      // Out to its side and up, then a slow, swaying fall to the grass.
      const side = (i - (CARDS - 1) / 2) * 0.45;
      const up = Math.sin(Math.min(1, k * 2.2) * Math.PI * 0.5) * 0.7;
      const fall = Math.max(0, k - 0.45) / 0.55;
      card.position.set(
        position[0] + side * Math.min(1, k * 2) + Math.sin(k * 9 + i) * 0.06 * fall,
        position[1] + up - (position[1] + 0.7) * fall * fall,
        position[2] + 0.25 * Math.min(1, k * 3),
      );
      card.rotation.set(Math.sin(k * 7 + i) * 0.5, Math.sin(k * 5 + i * 2) * 0.6, side * 0.4);
      card.scale.setScalar(Math.min(1, k * 8) * (k > 0.85 ? (1 - k) / 0.15 : 1));
    });
  });
  return (
    <group>
      {Array.from({ length: CARDS }, (_, i) => (
        <group
          key={i}
          ref={(el) => {
            if (el) cards.current[i] = el;
          }}
          visible={false}
        >
          <mesh raycast={() => null}>
            <planeGeometry args={[0.2, 0.28]} />
            <meshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// --- Containers: a test run that passes --------------------------------------------------

/** A green round badge with a white tick. */
function tickTexture() {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#5fbf5a';
    g.beginPath();
    g.arc(64, 64, 58, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#ffffff';
    g.lineWidth = 16;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(36, 66);
    g.lineTo(56, 86);
    g.lineTo(92, 44);
    g.stroke();
  });
}

const TICKS = 5;
export const TEST_RUN_SECONDS = 2.6;

/**
 * A test run passing: green ticks pop up in a row one after another, hold, then rise a
 * little and fade together. Put it in a group facing the camera, so the row runs across
 * the screen.
 */
export function TestRun({ id, position }: { id: string; position: Vec3 }) {
  const ticks = useRef<THREE.Sprite[]>([]);
  const texture = useMemo(() => tickTexture(), []);
  const progress = useReaction(id, TEST_RUN_SECONDS);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    const t = p === null ? null : p * TEST_RUN_SECONDS;
    ticks.current.forEach((tick, i) => {
      const k = t === null ? -1 : (t - 0.25 - i * 0.2) / 0.25;
      tick.visible = k > 0 && p !== null;
      if (!tick.visible || p === null) return;
      const pop = k < 1 ? Math.sin(k * Math.PI * 0.75) * 1.2 : 1;
      const out = p > 0.8 ? (1 - p) / 0.2 : 1;
      tick.scale.setScalar(0.32 * pop * out);
      tick.position.set(
        position[0] + (i - (TICKS - 1) / 2) * 0.4,
        position[1] + Math.max(0, p - 0.8) * 1.5,
        position[2],
      );
    });
  });
  return (
    <group>
      {Array.from({ length: TICKS }, (_, i) => (
        <sprite
          key={i}
          ref={(el) => {
            if (el) ticks.current[i] = el;
          }}
          visible={false}
          raycast={() => null}
        >
          <spriteMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
        </sprite>
      ))}
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
 *
 * One surface blends both themes in its shader. Two stacked planes (one per theme) would
 * z-fight with each other and with the screen's own face, which shows as flicker once
 * the island is far away and depth precision drops. The polygon offset pulls the picture
 * towards the camera in the depth test, so it always wins against the screen face.
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
  const fade = useRef(0);
  const screen = useRef<THREE.Mesh>(null!);
  const material = useMemo(() => screenMaterial(uiTexture(false), uiTexture(true)), []);

  useEffect(
    () =>
      useWorld.subscribe((s, prev) => {
        if (s.activeCount !== prev.activeCount && s.activeObject === id) setDark((d) => !d);
      }),
    [id],
  );

  useFrame((_, delta) => {
    easing.damp(fade, 'current', dark ? 1 : 0, 0.25, delta);
    (screen.current.material as THREE.ShaderMaterial).uniforms.mixAmount.value = fade.current;
  });

  return (
    <mesh ref={screen} position={position} material={material} raycast={() => null}>
      <planeGeometry args={[width, height]} />
    </mesh>
  );
}

/** Unlit material that shows a blend of two textures: 0 = the first, 1 = the second. */
function screenMaterial(light: THREE.Texture, dark: THREE.Texture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      light: { value: light },
      dark: { value: dark },
      mixAmount: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D light;
      uniform sampler2D dark;
      uniform float mixAmount;
      varying vec2 vUv;
      void main() {
        gl_FragColor = mix(texture2D(light, vUv), texture2D(dark, vUv), mixAmount);
        #include <colorspace_fragment>
      }
    `,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -8,
  });
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
