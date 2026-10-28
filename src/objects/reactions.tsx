/**
 * Small click reactions, made in code because each generated model is one solid piece.
 * Each wraps its object and animates the whole of it around the group origin, which
 * sits at the object's base.
 */
import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import { useReaction } from './useReaction';

const TAU = Math.PI * 2;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

interface ReactionProps {
  /** The interactive object's id, as in the store. */
  id: string;
  children: ReactNode;
}

/** A happy squash-and-stretch hop. */
export function Hop({
  id,
  height = 0.3,
  seconds = 0.75,
  children,
}: ReactionProps & { height?: number; seconds?: number }) {
  const ref = useRef<THREE.Group>(null!);
  const progress = useReaction(id, seconds);
  useFrame(({ clock }) => {
    const t = progress(clock.elapsedTime);
    const g = ref.current;
    if (t === null) {
      g.position.y = 0;
      g.scale.setScalar(1);
      return;
    }
    g.position.y = Math.sin(t * Math.PI) * height;
    // Stretch on the way up, squash on landing.
    const s = Math.sin(t * TAU) * 0.12;
    g.scale.set(1 - s * 0.5, 1 + s, 1 - s * 0.5);
  });
  return <group ref={ref}>{children}</group>;
}

/** A wobble that dies down, like something nudged. */
export function Wobble({
  id,
  angle = 0.07,
  shakes = 4,
  seconds = 0.9,
  children,
}: ReactionProps & { angle?: number; shakes?: number; seconds?: number }) {
  const ref = useRef<THREE.Group>(null!);
  const progress = useReaction(id, seconds);
  useFrame(({ clock }) => {
    const t = progress(clock.elapsedTime);
    ref.current.rotation.z = t === null ? 0 : Math.sin(t * shakes * TAU) * angle * (1 - t);
  });
  return <group ref={ref}>{children}</group>;
}

/** Whole turns around the vertical axis, easing out, ending where it started. */
export function Spin({
  id,
  turns = 2,
  seconds = 1.6,
  children,
}: ReactionProps & { turns?: number; seconds?: number }) {
  const ref = useRef<THREE.Group>(null!);
  const progress = useReaction(id, seconds);
  useFrame(({ clock }) => {
    const t = progress(clock.elapsedTime);
    ref.current.rotation.y = t === null ? 0 : easeOutCubic(t) * turns * TAU;
  });
  return <group ref={ref}>{children}</group>;
}
