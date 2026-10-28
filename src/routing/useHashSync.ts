import { useEffect } from 'react';
import { useWorld } from '@/store/useWorld';
import { parseHash, sameHash, toHash } from './hash';

/**
 * Keeps the focused island and the address hash in sync, in both directions.
 * Each island visit adds a history entry, so the browser Back button works.
 * Both directions compare before writing, so they never loop.
 */
export function useHashSync() {
  const focused = useWorld((s) => s.focused);

  // Address to store: on load and on every hash change (Back, Forward, typed links).
  useEffect(() => {
    const apply = () => {
      const route = parseHash(window.location.hash);
      if (route.view !== 'world') return;
      const { focused: current, focus, back } = useWorld.getState();
      if (route.island && route.island !== current) focus(route.island);
      if (!route.island && current) back();
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  // Store to address. Reads the live store value: on the first render both effects run in
  // the same commit, and the rendered value would still be stale after a deep link.
  useEffect(() => {
    const next = toHash({ view: 'world', island: useWorld.getState().focused });
    if (!sameHash(window.location.hash, next)) window.location.hash = next;
  }, [focused]);
}
