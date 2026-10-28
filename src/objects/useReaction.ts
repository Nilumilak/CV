import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useReducedMotion } from 'motion/react';
import { useWorld } from '@/store/useWorld';

/**
 * Plays a one-shot reaction each time the object is activated, from a click on the
 * island or from the panel's "Show me" button. With reduced motion it never plays.
 *
 * Returns a function for useFrame: progress from 0 to 1 while playing, null otherwise.
 */
export function useReaction(id: string, seconds: number) {
  const start = useRef<number | null>(null);
  const clock = useThree((s) => s.clock);
  const reduceMotion = useReducedMotion();

  useEffect(
    () =>
      useWorld.subscribe((s, prev) => {
        if (s.activeCount === prev.activeCount || s.activeObject !== id || reduceMotion) return;
        start.current = clock.elapsedTime;
      }),
    [id, clock, reduceMotion],
  );

  return (now: number): number | null => {
    if (start.current === null) return null;
    const t = (now - start.current) / seconds;
    if (t < 1) return t;
    start.current = null;
    return null;
  };
}
