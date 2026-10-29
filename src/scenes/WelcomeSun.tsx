import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorld } from '@/store/useWorld';

/**
 * Where the welcome sun hangs, as seen from the camera: low over the horizon, a little
 * left of the middle, in the direction the welcome view looks (see FlyIn).
 */
const SUN_DIRECTION = new THREE.Vector3(-0.14, 0.05, -1).normalize();
/** Far beyond the clouds, but inside the camera's far plane and the sky dome. */
const DISTANCE = 800;
/** Camera heights between which the sun fades out during the dive (the clouds are at 50). */
const FADE = { from: 98, to: 64 } as const;

const noHit = () => null;
const smoothstep = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

function canvasTexture(size: number, draw: (g: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d')!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A radial gradient from the middle of a square, as [stop, css colour] pairs. */
function radial(stops: [number, string][]) {
  return canvasTexture(256, (g) => {
    const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    for (const [at, colour] of stops) r.addColorStop(at, colour);
    g.fillStyle = r;
    g.fillRect(0, 0, 256, 256);
  });
}

/** Soft rays fanning out from the middle, each fading along its length. */
function raysTexture() {
  return canvasTexture(512, (g) => {
    g.translate(256, 256);
    const RAYS = 16;
    for (let i = 0; i < RAYS; i++) {
      // Uneven widths and lengths, so the fan looks painted rather than mechanical.
      const width = 0.05 + 0.05 * Math.abs(Math.sin(i * 2.3));
      const length = 190 + 60 * Math.abs(Math.sin(i * 1.7));
      const fade = g.createRadialGradient(0, 0, 20, 0, 0, length);
      fade.addColorStop(0, 'rgba(255, 226, 180, 0.5)');
      fade.addColorStop(1, 'rgba(255, 226, 180, 0)');
      g.fillStyle = fade;
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, length, -width / 2, width / 2);
      g.closePath();
      g.fill();
      g.rotate((Math.PI * 2) / RAYS);
    }
  });
}

/**
 * A low, warm sun for the welcome view: a bright core, a wide golden glow and faint rays
 * turning very slowly. It gives the sky a focal point behind the title, then fades out as
 * the dive drops into the clouds. The core and rays add light; the glow is a plain warm
 * wash, because added light only turns a blue sky white, never warm.
 */
export function WelcomeSun() {
  const group = useRef<THREE.Group>(null!);
  const layers = useRef<THREE.Sprite[]>([]);
  const rays = useRef<THREE.SpriteMaterial>(null!);

  const textures = useMemo(
    () => ({
      core: radial([
        [0, 'rgba(255, 253, 244, 1)'],
        [0.35, 'rgba(255, 246, 220, 0.9)'],
        [0.6, 'rgba(255, 232, 186, 0.25)'],
        [1, 'rgba(255, 226, 170, 0)'],
      ]),
      glow: radial([
        [0, 'rgba(255, 220, 170, 0.75)'],
        [0.3, 'rgba(255, 206, 156, 0.3)'],
        [1, 'rgba(255, 200, 150, 0)'],
      ]),
      rays: raysTexture(),
    }),
    [],
  );

  // [texture, size in world units at DISTANCE, strength, blending]
  const SPRITES = [
    [textures.glow, 600, 0.6, THREE.NormalBlending],
    [textures.rays, 520, 0.12, THREE.AdditiveBlending],
    [textures.core, 56, 0.85, THREE.AdditiveBlending],
  ] as const;

  useFrame(({ camera, clock }) => {
    const phase = useWorld.getState().phase;
    const fade = phase === 'world' ? 0 : smoothstep(FADE.to, FADE.from, camera.position.y);
    group.current.visible = fade > 0.001;
    if (!group.current.visible) return;
    group.current.position.copy(camera.position).addScaledVector(SUN_DIRECTION, DISTANCE);
    layers.current.forEach((sprite, i) => {
      (sprite.material as THREE.SpriteMaterial).opacity = SPRITES[i]![2] * fade;
    });
    rays.current.rotation = clock.elapsedTime * 0.015;
  });

  return (
    <group ref={group} visible={false}>
      {SPRITES.map(([map, size, , blending], i) => (
        <sprite
          key={i}
          ref={(el) => {
            if (el) layers.current[i] = el;
          }}
          scale={size}
          raycast={noHit}
        >
          <spriteMaterial
            ref={map === textures.rays ? rays : undefined}
            map={map}
            transparent
            depthWrite={false}
            fog={false}
            blending={blending}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
}
