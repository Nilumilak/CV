/**
 * Code-made effects for the Arena island (design: docs/plan/islands/arena.md).
 * Screen and scoreboard pictures are single surfaces with a polygon offset, so they never
 * z-fight with the faces of the models they sit on (see ScreenPicture on Radio).
 */
import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { colors, gradientMap, palette } from '@/materials/toon';
import { useReaction } from '@/objects/useReaction';
import { beamShader, glareTexture } from '../lightMaterials';

type Vec3 = [number, number, number];
const noHit = () => null;
const smoothstep = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Depth bias that keeps a picture in front of the model face it is placed on. */
const PICTURE_OFFSET = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 };

/**
 * One screen of the display stands. Dimmed when idle; when activated it lights up after
 * `delay` (share of the reaction), stays lit, and dims again at the end.
 */
export function StandScreen({
  id,
  kind,
  delay,
  position,
  tilt = 0,
  width,
  height,
}: {
  id: string;
  kind: 'phone' | 'desktop' | 'gate';
  delay: number;
  position: Vec3;
  /** Degrees the screen leans back (faces upward), to match the model's screen. */
  tilt?: number;
  width: number;
  height: number;
}) {
  const screen = useRef<THREE.Mesh>(null!);
  const progress = useReaction(id, 3.2);
  const texture = useMemo(() => appTexture(kind), [kind]);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    const lit =
      p === null
        ? 0
        : smoothstep(clamp01((p - delay) / 0.12)) * smoothstep(clamp01((1 - p) / 0.15));
    (screen.current.material as THREE.MeshBasicMaterial).color.setScalar(0.45 + 0.55 * lit);
  });
  return (
    <mesh
      ref={screen}
      position={position}
      rotation-x={THREE.MathUtils.degToRad(-tilt)}
      raycast={noHit}
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} {...PICTURE_OFFSET} />
    </mesh>
  );
}

const FLAG_COLORS = [colors.accentGold, '#3C7DD9', colors.roofRed, '#5fbf5a', '#fbf3e0', '#6fb3d9'];

/** Six little team flags on poles that pop up one after another, then go down again. */
export function TeamFlags({
  id,
  position,
  spacing = 0.32,
}: {
  id: string;
  position: Vec3;
  spacing?: number;
}) {
  const flags = useRef<THREE.Group[]>([]);
  const progress = useReaction(id, 3.2);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    for (let i = 0; i < 6; i++) {
      const flag = flags.current[i];
      if (!flag) continue;
      const k =
        p === null
          ? 0
          : smoothstep(clamp01((p - 0.35 - i * 0.06) / 0.1)) * smoothstep(clamp01((1 - p) / 0.12));
      flag.visible = k > 0.001;
      flag.scale.set(1, k, 1);
    }
  });
  return (
    <group position={position}>
      {FLAG_COLORS.map((color, i) => (
        <group
          key={i}
          ref={(el) => {
            if (el) flags.current[i] = el;
          }}
          position={[(i - 2.5) * spacing, 0, 0]}
          visible={false}
        >
          <mesh position={[0, 0.35, 0]} material={palette.wood} raycast={noHit}>
            <cylinderGeometry args={[0.015, 0.02, 0.7, 6]} />
          </mesh>
          <mesh position={[0.1, 0.6, 0]} raycast={noHit}>
            <planeGeometry args={[0.2, 0.14]} />
            <meshBasicMaterial color={color} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** How long a tag shows, from pop to fade. */
const TAG_SECONDS = 1.6;

/**
 * A gold tag (e.g. "−40%") that pops up above an object, rises a little and fades. Always
 * faces the camera. Its width follows the text, at a constant height. `delay` (seconds)
 * holds it back after the click, e.g. until another reaction has played out.
 */
export function PercentTag({
  id,
  position,
  text = '−40%',
  delay = 0,
}: {
  id: string;
  position: Vec3;
  text?: string;
  delay?: number;
}) {
  const sprite = useRef<THREE.Sprite>(null!);
  const progress = useReaction(id, TAG_SECONDS + delay);
  const { texture, aspect } = useMemo(() => tagTexture(text), [text]);
  useFrame(({ clock }) => {
    const whole = progress(clock.elapsedTime);
    const p = whole === null ? null : (whole * (TAG_SECONDS + delay) - delay) / TAG_SECONDS;
    const s = sprite.current;
    s.visible = p !== null && p >= 0;
    if (p === null || p < 0) return;
    const pop = p < 0.15 ? Math.sin((p / 0.15) * Math.PI * 0.75) * 1.2 : 1;
    s.scale.set(0.45 * aspect * pop, 0.45 * pop, 1);
    s.position.set(position[0], position[1] + p * 0.5, position[2]);
    (s.material as THREE.SpriteMaterial).opacity = p > 0.75 ? (1 - p) / 0.25 : 1;
  });
  return (
    <sprite ref={sprite} visible={false} raycast={noHit}>
      <spriteMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

/** Rows of scores on the scoreboard. When activated they whizz past fast and slow to a stop. */
export function ScoreboardRows({
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
  const board = useRef<THREE.Mesh>(null!);
  const progress = useReaction(id, 2.6);
  const texture = useMemo(() => rowsTexture(), []);
  useFrame(({ clock }, delta) => {
    const p = progress(clock.elapsedTime);
    // Speed in screen-heights per second: ramps up, cruises, eases down to a stop.
    const speed = p === null ? 0 : 9 * Math.sin(p * Math.PI) ** 1.5;
    const map = (board.current.material as THREE.MeshBasicMaterial).map!;
    map.offset.y = (map.offset.y + speed * delta * map.repeat.y) % 1;
  });
  return (
    <mesh ref={board} position={position} raycast={noHit}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} {...PICTURE_OFFSET} />
    </mesh>
  );
}

// --- Winged shoe: sheds weight, then dashes -----------------------------------------------

/** The shoe's reaction, in seconds. */
export const SHOE_SECONDS = 2.6;
/** Its phases: shake off the weights, dash out, skid round, dash back, skid round. */
const SHAKE = [0, 0.5] as const;
const OUT = [0.55, 1.1] as const;
const SKID_1 = [1.1, 1.35] as const;
const BACK_DASH = [1.35, 1.9] as const;
const SKID_2 = [1.9, 2.15] as const;
/** How far it dashes, along its toe (local −X), in its own units. */
const DASH = 1.0;

const span = (t: number, [a, b]: readonly [number, number]) => clamp01((t - a) / (b - a));

/**
 * Wraps the winged shoe (toe along −X): it shakes, dashes out along its toe, skids round
 * in a puff of dust, dashes back and skids round to face the way it started. Speed lines
 * trail from its heel while it runs.
 */
export function ShoeDash({ id, children }: { id: string; children: ReactNode }) {
  const run = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const lines = useRef<THREE.Mesh[]>([]);
  const progress = useReaction(id, SHOE_SECONDS);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    const t = p === null ? -1 : p * SHOE_SECONDS;
    const out = smoothstep(span(t, OUT));
    const back = smoothstep(span(t, BACK_DASH));
    run.current.position.x = p === null ? 0 : -DASH * (out - back);
    // Each skid turns it half round; after both it faces the way it started.
    run.current.rotation.y =
      p === null ? 0 : Math.PI * (smoothstep(span(t, SKID_1)) + smoothstep(span(t, SKID_2)));
    const dashing = (t > OUT[0] && t < OUT[1]) || (t > BACK_DASH[0] && t < BACK_DASH[1]);
    const shaking = t > SHAKE[0] && t < SHAKE[1];
    body.current.rotation.z = shaking ? Math.sin(t * 60) * 0.06 : 0;
    // Little bounding hops while it runs.
    body.current.position.y = dashing ? Math.abs(Math.sin(t * 22)) * 0.06 : 0;
    lines.current.forEach((line, i) => {
      line.visible = dashing;
      line.scale.x = 0.6 + 0.4 * Math.abs(Math.sin(t * 17 + i * 2));
    });
  });
  return (
    <group ref={run}>
      <group ref={body}>
        {children}
        {/* Speed lines streaming back from the heel (+X). */}
        {[0.18, 0.32, 0.46].map((y, i) => (
          <mesh
            key={i}
            ref={(el) => {
              if (el) lines.current[i] = el;
            }}
            position={[0.95 + i * 0.08, y, 0]}
            visible={false}
            raycast={noHit}
          >
            <planeGeometry args={[0.45, 0.025]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

const WEIGHTS = 4;
const weightMaterial = new THREE.MeshToonMaterial({ color: '#6c7178', gradientMap });
const weightGeometry = new THREE.BoxGeometry(0.13, 0.09, 0.11);
const puffMaterial = new THREE.MeshBasicMaterial({
  color: '#f4efe4',
  transparent: true,
  depthWrite: false,
});
const puffGeometry = new THREE.SphereGeometry(0.1, 10, 8);

/**
 * The old weight the shoe shook off: a few grey blocks pop off its top, tumble to the
 * grass and sink away. Then puffs of dust where it skids. Positions are in the shoe's
 * place, before it dashes.
 */
export function ShedWeights({ id, top }: { id: string; top: number }) {
  const weights = useRef<THREE.Mesh[]>([]);
  const puffs = useRef<THREE.Mesh[]>([]);
  const progress = useReaction(id, SHOE_SECONDS);
  const throws = useMemo(
    () =>
      Array.from({ length: WEIGHTS }, (_, i) => {
        const a = (i / WEIGHTS) * Math.PI * 2 + 0.4;
        return { dx: Math.cos(a) * 0.9, dz: Math.sin(a) * 0.6, up: 1.6 + (i % 2) * 0.5 };
      }),
    [],
  );
  // Dust where it sets off and at each skid (its toe end, then back home).
  const dust = useMemo(
    () =>
      [
        [OUT[0], 0],
        [SKID_1[0], -DASH],
        [SKID_2[0], 0],
      ].flatMap(([at, x]) =>
        Array.from({ length: 4 }, (_, i) => ({
          at: at!,
          x: x! + (i - 1.5) * 0.15,
          z: (i % 2) * 0.2 - 0.1,
        })),
      ),
    [],
  );
  /** Each puff fades on its own, so each has its own copy of the material. */
  const puffMaterials = useMemo(() => dust.map(() => puffMaterial.clone()), [dust]);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    const t = p === null ? -1 : p * SHOE_SECONDS;
    throws.forEach((w, i) => {
      const m = weights.current[i];
      if (!m) return;
      const k = t - 0.12 - i * 0.05;
      m.visible = p !== null && k > 0 && k < 1.4;
      if (!m.visible) return;
      // Thrown up and out, falling onto the grass, then sinking away.
      const fly = Math.min(k, 0.7);
      m.position.set(w.dx * fly, Math.max(0.05, top + w.up * fly - 4.9 * fly * fly), w.dz * fly);
      m.rotation.set(fly * 6 + i, fly * 4, 0);
      m.scale.setScalar(k > 1 ? 1.4 - k : 1);
    });
    dust.forEach((d, i) => {
      const m = puffs.current[i];
      if (!m) return;
      const k = p === null ? -1 : (t - d.at) / 0.6;
      m.visible = k > 0 && k < 1;
      if (!m.visible) return;
      m.position.set(d.x, 0.08 + k * 0.25, d.z);
      m.scale.setScalar(0.6 + k * 1.6);
      (m.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.8;
    });
  });
  return (
    <group>
      {throws.map((_, i) => (
        <mesh
          key={`w${i}`}
          ref={(el) => {
            if (el) weights.current[i] = el;
          }}
          geometry={weightGeometry}
          material={weightMaterial}
          visible={false}
          raycast={noHit}
        />
      ))}
      {dust.map((_, i) => (
        <mesh
          key={`d${i}`}
          ref={(el) => {
            if (el) puffs.current[i] = el;
          }}
          geometry={puffGeometry}
          material={puffMaterials[i]}
          visible={false}
          raycast={noHit}
        />
      ))}
    </group>
  );
}

// --- Team booths: a tin-can telephone ------------------------------------------------------

const STRING_POINTS = 24;
/** The reaction: a message goes over (0–1.2 s), a pause, the reply comes back (1.5–2.6 s). */
export const PHONE_SECONDS = 2.8;
const OVER = [0, 1.2] as const;
const BACK = [1.5, 2.6] as const;

const tin = new THREE.MeshToonMaterial({ color: '#b9c2c9', gradientMap });

/** A small cream envelope with a gold seal. */
function envelopeTexture() {
  return canvasTexture(128, 88, (g) => {
    g.fillStyle = '#fffaf0';
    box(g, 4, 4, 120, 80, 8);
    g.strokeStyle = 'rgba(120, 100, 80, 0.55)';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(10, 12);
    g.lineTo(64, 50);
    g.lineTo(118, 12);
    g.stroke();
    g.fillStyle = colors.accentGold;
    g.beginPath();
    g.arc(64, 50, 9, 0, Math.PI * 2);
    g.fill();
  });
}

/** 0 → 1 → 0 over `width` seconds after `at`: a quick pop. */
const popAt = (t: number | null, at: number, width = 0.3) =>
  t === null || t < at || t > at + width ? 0 : Math.sin(((t - at) / width) * Math.PI);

const stringPoint = new THREE.Vector3();

/**
 * Two tin cans at the booths' windows, joined by a sagging string: two teams' apps talking
 * across the frame. On click an envelope rides the string over to the other booth, that
 * can gives a little jump, and a reply rides back. The string dips under the envelope's
 * weight as it goes.
 */
export function TinCanPhone({ id, from, to }: { id: string; from: Vec3; to: Vec3 }) {
  const a = useMemo(() => new THREE.Vector3(...from), [from]);
  const b = useMemo(() => new THREE.Vector3(...to), [to]);
  const envelope = useRef<THREE.Sprite>(null!);
  const cans = useRef<THREE.Group[]>([]);
  const texture = useMemo(() => envelopeTexture(), []);
  const string = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(STRING_POINTS * 3), 3),
    );
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#efe6d2' }));
    line.raycast = noHit;
    return line;
  }, []);
  // Each can's axis runs along the string, open end towards the other can.
  const turn = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        b.clone().sub(a).normalize(),
      ),
    [a, b],
  );
  const progress = useReaction(id, PHONE_SECONDS);

  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    const t = p === null ? null : p * PHONE_SECONDS;
    const going =
      t !== null && t < OVER[1] ? smoothstep((t - OVER[0]) / (OVER[1] - OVER[0])) : null;
    const coming =
      t !== null && t >= BACK[0] && t < BACK[1]
        ? 1 - smoothstep((t - BACK[0]) / (BACK[1] - BACK[0]))
        : null;
    const along = going ?? coming;

    const length = a.distanceTo(b);
    const pos = string.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < STRING_POINTS; i++) {
      const s = i / (STRING_POINTS - 1);
      stringPoint.lerpVectors(a, b, s);
      stringPoint.y -= 0.06 * length * 4 * s * (1 - s);
      if (along !== null) stringPoint.y -= 0.05 * Math.exp(-(((s - along) / 0.12) ** 2));
      pos.setXYZ(i, stringPoint.x, stringPoint.y, stringPoint.z);
    }
    pos.needsUpdate = true;
    string.geometry.computeBoundingSphere();

    const e = envelope.current;
    e.visible = along !== null;
    if (along !== null) {
      // Rides on top of the string, rocking a little.
      const i = Math.round(along * (STRING_POINTS - 1));
      e.position.set(pos.getX(i), pos.getY(i) + 0.07, pos.getZ(i));
      e.material.rotation = Math.sin((t ?? 0) * 12) * 0.15;
      e.scale.set(0.16, 0.11, 1);
    }
    // The can that receives gives a little jump.
    cans.current[1]?.scale.setScalar(1 + 0.3 * popAt(t, OVER[1]));
    cans.current[0]?.scale.setScalar(1 + 0.3 * popAt(t, BACK[1]));
  });

  return (
    <group>
      {[a, b].map((at, i) => (
        <group
          key={i}
          ref={(el) => {
            if (el) cans.current[i] = el;
          }}
          position={at}
          quaternion={turn}
        >
          {/* The can sits behind its end of the string, inside its own booth's window. */}
          <mesh material={tin} position-y={i === 0 ? -0.045 : 0.045} raycast={noHit}>
            <cylinderGeometry args={[0.045, 0.045, 0.09, 12]} />
          </mesh>
        </group>
      ))}
      <primitive object={string} />
      <sprite ref={envelope} visible={false} raycast={noHit}>
        <spriteMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
      </sprite>
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

function box(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}

const BLUE = '#3C7DD9';

/** A simple app screen: mobile, desktop or a login gate. No real content. */
function appTexture(kind: 'phone' | 'desktop' | 'gate') {
  const [w, h] = kind === 'phone' ? [200, 400] : kind === 'desktop' ? [400, 260] : [260, 320];
  return canvasTexture(w, h, (g) => {
    g.fillStyle = '#f4f7fb';
    g.fillRect(0, 0, w, h);
    g.fillStyle = BLUE;
    g.fillRect(0, 0, w, kind === 'phone' ? 46 : 36);
    if (kind === 'gate') {
      // Login: avatar, two fields, a button.
      g.fillStyle = '#cdd9ec';
      g.beginPath();
      g.arc(w / 2, 100, 32, 0, Math.PI * 2);
      g.fill();
      box(g, 40, 160, w - 80, 30, 8);
      box(g, 40, 205, w - 80, 30, 8);
      g.fillStyle = colors.accentGold;
      box(g, 70, 255, w - 140, 34, 17);
      return;
    }
    // A list of events with odds buttons.
    const rows = kind === 'phone' ? 6 : 4;
    const top = kind === 'phone' ? 66 : 54;
    const rowH = kind === 'phone' ? 52 : 46;
    for (let r = 0; r < rows; r++) {
      const y = top + r * rowH;
      g.fillStyle = '#dfe7f3';
      box(g, 14, y, w - 28, rowH - 10, 8);
      g.fillStyle = '#9fb3d1';
      box(g, 26, y + 10, w * 0.35, 10, 5);
      g.fillStyle = r % 2 ? colors.accentGold : BLUE;
      for (let b = 0; b < (kind === 'phone' ? 2 : 3); b++)
        box(g, w - 30 - (b + 1) * 46, y + 8, 40, rowH - 26, 6);
    }
  });
}

/** Long strip of score rows; the scoreboard shows a window of it and scrolls through. */
function rowsTexture() {
  const W = 320,
    ROW = 40,
    ROWS = 48;
  const texture = canvasTexture(W, ROW * ROWS, (g) => {
    g.fillStyle = '#1d3557';
    g.fillRect(0, 0, W, ROW * ROWS);
    for (let r = 0; r < ROWS; r++) {
      const y = r * ROW;
      g.fillStyle = r % 2 ? '#24406a' : '#1d3557';
      g.fillRect(0, y, W, ROW);
      g.fillStyle = '#f3c25b';
      box(g, 14, y + 12, 22, 16, 4);
      g.fillStyle = '#d9e4f5';
      box(g, 48, y + 14, 90 + ((r * 37) % 70), 12, 6);
      g.fillStyle = '#fff6d8';
      box(g, W - 76, y + 10, 26, 20, 4);
      box(g, W - 44, y + 10, 26, 20, 4);
    }
  });
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.y = 8 / ROWS; // 8 rows visible at a time
  return texture;
}

/** A gold rounded tag with the text in dark ink. */
/** A gold rounded tag sized to its text; returns the texture and its width ÷ height. */
function tagTexture(text: string) {
  const font = 'bold 64px Fredoka, Nunito, system-ui, sans-serif';
  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = font;
  const w = Math.max(256, Math.ceil(measure.measureText(text).width) + 90);
  const texture = canvasTexture(w, 128, (g) => {
    g.fillStyle = colors.accentGold;
    box(g, 6, 6, w - 12, 116, 40);
    g.fillStyle = '#2b2422';
    g.font = font;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, w / 2, 68);
  });
  return { texture, aspect: w / 128 };
}

/**
 * Stadium floodlights as light, not objects: a soft glare at each lamp head, a faint beam
 * falling to the pitch, and one gentle light that brightens the pitch. Nothing has a hard
 * edge: the glare fades out from its centre, and the beams fade along their length and
 * towards their sides.
 */
export function Floodlights({
  lamps,
  pitch,
  beamReach = 0.6,
}: {
  lamps: Vec3[];
  /** Where the lamps point: the middle of the pitch. */
  pitch: Vec3;
  /** How far each beam reaches towards the pitch, as a share of the way. */
  beamReach?: number;
}) {
  const glare = useMemo(() => glareTexture(), []);
  const beams = useMemo(
    () =>
      lamps.map((lamp) => {
        const from = new THREE.Vector3(...lamp);
        const to = from.clone().lerp(new THREE.Vector3(...pitch), beamReach);
        const length = from.distanceTo(to);
        const middle = from.clone().add(to).multiplyScalar(0.5);
        // The cylinder's +Y end is the narrow lamp end.
        const up = from.clone().sub(to).normalize();
        const turn = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
        return { length, middle: middle.toArray() as Vec3, turn };
      }),
    [lamps, pitch, beamReach],
  );
  const beamMaterial = useMemo(() => beamShader(), []);

  return (
    <group>
      {lamps.map((lamp, i) => (
        <sprite key={`glare-${i}`} position={lamp} scale={0.9} raycast={noHit}>
          <spriteMaterial
            map={glare}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
      ))}
      {beams.map((b, i) => (
        <mesh
          key={`beam-${i}`}
          position={b.middle}
          quaternion={b.turn}
          material={beamMaterial}
          renderOrder={3}
          raycast={noHit}
        >
          <cylinderGeometry args={[0.1, 0.85, b.length, 24, 1, true]} />
        </mesh>
      ))}
      <pointLight
        position={[pitch[0], pitch[1] + 1.6, pitch[2]]}
        color="#fff4dc"
        intensity={1.2}
        distance={4.5}
        decay={2}
      />
    </group>
  );
}
