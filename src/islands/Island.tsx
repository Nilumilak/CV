import { useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, useCursor } from '@react-three/drei';
import { easing } from 'maath';
import type * as THREE from 'three';
import type { IslandLayout } from '@/data/types';
import { useWorld } from '@/store/useWorld';
import { PlaceholderIsland } from './PlaceholderIsland';

interface IslandProps {
  layout: IslandLayout;
  /** Real island art (Phase 4). Falls back to the placeholder. */
  children?: ReactNode;
}

/** Positions an island, makes it bob, and handles hover and click to focus. */
export function Island({ layout, children }: IslandProps) {
  const [hovered, setHovered] = useState(false);
  const isFocused = useWorld((s) => s.focused === layout.id);
  const focus = useWorld((s) => s.focus);
  const body = useRef<THREE.Group>(null!);

  const interactive = hovered && !isFocused;
  useCursor(interactive);

  useFrame((_, delta) => {
    easing.damp3(body.current.scale, interactive ? 1.04 : 1, 0.15, delta);
  });

  return (
    <group position={layout.position} scale={layout.scale}>
      <Float speed={0.8} rotationIntensity={0.05} floatIntensity={0.4} floatingRange={[-0.2, 0.2]}>
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
      </Float>
    </group>
  );
}
