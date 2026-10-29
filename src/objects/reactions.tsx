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

/** Squashes down to `to` of its height (bulging a little sideways) and springs back. */
export function Squash({
  id,
  to = 0.6,
  seconds = 1.1,
  children,
}: ReactionProps & { to?: number; seconds?: number }) {
  const ref = useRef<THREE.Group>(null!);
  const progress = useReaction(id, seconds);
  useFrame(({ clock }) => {
    const t = progress(clock.elapsedTime);
    // Down fast, hold briefly, spring back with a small overshoot.
    const squash =
      t === null
        ? 0
        : t < 0.25
          ? easeOutCubic(t / 0.25)
          : t < 0.45
            ? 1
            : Math.max(-0.12, Math.cos(((t - 0.45) / 0.55) * Math.PI * 1.5) * (1 - t) * 1.8);
    const y = 1 - (1 - to) * squash;
    ref.current.scale.set(1 / Math.sqrt(y), y, 1 / Math.sqrt(y));
  });
  return <group ref={ref}>{children}</group>;
}
