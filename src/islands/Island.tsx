import { useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCursor } from '@react-three/drei';
import { easing } from 'maath';
import { useReducedMotion } from 'motion/react';
import type * as THREE from 'three';
import type { IslandLayout } from '@/data/types';
import { useWorld } from '@/store/useWorld';
import { applyBob } from './bob';
import { PlaceholderIsland } from './PlaceholderIsland';

interface IslandProps {
  layout: IslandLayout;
  /** Real island art (Phase 4). Falls back to the placeholder. */
  children?: ReactNode;
}

/** Positions an island, makes it bob slowly, and handles hover and click to focus. */
export function Island({ layout, children }: IslandProps) {
  const [hovered, setHovered] = useState(false);
  const isFocused = useWorld((s) => s.focused === layout.id);
  const focus = useWorld((s) => s.focus);
  const bob = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const reduceMotion = useReducedMotion();

  const interactive = hovered && !isFocused;
  useCursor(interactive);

  useFrame(({ clock }, delta) => {
    easing.damp3(body.current.scale, interactive ? 1.04 : 1, 0.15, delta);
    if (!reduceMotion) applyBob(bob.current, layout.seed, clock.elapsedTime);
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
