import { useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCursor } from '@react-three/drei';
import { easing } from 'maath';
import { useReducedMotion } from 'motion/react';
import type * as THREE from 'three';
import type { IslandLayout } from '@/data/types';
import { useWorld } from '@/store/useWorld';
import { PlaceholderIsland } from './PlaceholderIsland';

interface IslandProps {
  layout: IslandLayout;
  /** Real island art (Phase 4). Falls back to the placeholder. */
  children?: ReactNode;
}

/** How far an island rises and sinks, in island units. */
const BOB_HEIGHT = 0.45;
/** Radians per second: one full rise and fall takes about 10 seconds. */
const BOB_SPEED = 0.6;
/** Peak tilt that goes with the bob, in radians. */
const BOB_TILT = 0.012;

/** Positions an island, makes it bob slowly, and handles hover and click to focus. */
export function Island({ layout, children }: IslandProps) {
  const [hovered, setHovered] = useState(false);
  const isFocused = useWorld((s) => s.focused === layout.id);
  const focus = useWorld((s) => s.focus);
  const bob = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const reduceMotion = useReducedMotion();
  // Each island starts at its own point of the wave, so they never move in unison.
  const phase = layout.seed * 2.4;

  const interactive = hovered && !isFocused;
  useCursor(interactive);

  useFrame(({ clock }, delta) => {
    easing.damp3(body.current.scale, interactive ? 1.04 : 1, 0.15, delta);
    if (reduceMotion) return;
    const t = clock.elapsedTime * BOB_SPEED + phase;
    bob.current.position.y = Math.sin(t) * BOB_HEIGHT;
    // A faint sway that lags the bob, like something floating on air.
    bob.current.rotation.x = Math.sin(t - 0.8) * BOB_TILT;
    bob.current.rotation.z = Math.cos(t * 0.7) * BOB_TILT;
  });

  return (
    <group position={layout.position} scale={layout.scale}>
      <group ref={bob}>
        <group
          ref={body}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={() => setHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            if (!isFocused) focus(layout.id);
          }}
        >
          {children ?? <PlaceholderIsland id={layout.id} seed={layout.seed} />}
        </group>
      </group>
    </group>
  );
}
